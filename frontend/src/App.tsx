import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Region = "MUMBAI" | "SINGAPORE" | "EU";
type Rank =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "ASCENDANT"
  | "IMMORTAL"
  | "RADIANT";
type Role = "DUELIST" | "SENTINEL" | "INITIATOR" | "CONTROLLER";
type Gender = "MALE" | "FEMALE" | "OTHER";

type User = {
  id: string;
  username: string;
  email: string;
  region: Region;
  rank: Rank;
  mmr: number;
  preferredRoles: Role[];
  gender: Gender;
};

type MatchState = {
  id: string;
  status: string;
  region: Region;
  averageMMR: number;
  acceptedUserIds: string[];
  partner: User | null;
};

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
const matchingBaseUrl = import.meta.env.VITE_MATCHING_URL || "http://localhost:8081";

const regionOptions: Region[] = ["MUMBAI", "SINGAPORE", "EU"];
const rankOptions: Rank[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
  "ASCENDANT",
  "IMMORTAL",
  "RADIANT",
];
const roleOptions: Role[] = ["DUELIST", "SENTINEL", "INITIATOR", "CONTROLLER"];
const genderOptions: Gender[] = ["MALE", "FEMALE", "OTHER"];

const defaultSignup = {
  username: "",
  email: "",
  password: "",
  region: "MUMBAI" as Region,
  rank: "GOLD" as Rank,
  mmr: 1000,
  gender: "OTHER" as Gender,
  preferredRoles: ["DUELIST"] as Role[],
};

function formatLabel(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function getGenderMeta(gender: Gender) {
  switch (gender) {
    case "MALE":
      return { symbol: "♂", label: "Male", tone: "male" };
    case "FEMALE":
      return { symbol: "♀", label: "Female", tone: "female" };
    default:
      return { symbol: "◌", label: "Other", tone: "other" };
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data as T;
}

function playAlertSound() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const notes = [440, 659.25, 880];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = index === 1 ? "triangle" : "sawtooth";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.14);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + index * 0.14 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.14 + 0.24);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + index * 0.14);
    oscillator.stop(context.currentTime + index * 0.14 + 0.26);
  });
}

function calcSynergy(user: User, partner: User | null) {
  if (!partner) return 0;

  let score = 48;
  if (user.region === partner.region) score += 14;
  if (user.rank === partner.rank) score += 14;
  if (Math.abs(user.mmr - partner.mmr) <= 100) score += 10;
  if (user.preferredRoles.some((role) => !partner.preferredRoles.includes(role))) score += 8;
  if (user.gender === partner.gender) score += 6;

  return Math.min(score, 99);
}

function AppShell({
  children,
  user,
  onLogout,
  queueState,
}: {
  children: ReactNode;
  user: User | null;
  onLogout: () => Promise<void>;
  queueState: string;
}) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="masthead-row">
          <Link className="brand" to="/">
            <span className="brand-mark">P</span>
            <div>
              <strong>Pulse Duo</strong>
              <span>Neural duo uplink</span>
            </div>
          </Link>

          <nav className="top-nav glass-card">
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/">
              Home
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/auth">
              Auth
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/arena">
              Arena
            </NavLink>
            <NavLink className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")} to="/intel">
              Intel
            </NavLink>
          </nav>

          <div className="status-cluster">
            <div className="hud-pill">
              <span className="tiny-label">Sector</span>
              <strong>{location.pathname === "/" ? "LOBBY" : location.pathname.replace("/", "").toUpperCase()}</strong>
            </div>
            <div className="hud-pill">
              <span className="tiny-label">State</span>
              <strong>{queueState}</strong>
            </div>
            {user ? (
              <div className="user-chip">
                <div>
                  <span className="tiny-label">Operator</span>
                  <strong>{user.username}</strong>
                </div>
                <button className="ghost-button" onClick={onLogout} type="button">
                  Logout
                </button>
              </div>
            ) : (
              <div className="hud-pill">
                <span className="tiny-label">Session</span>
                <strong>Offline</strong>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="page-frame">{children}</div>
    </div>
  );
}

function LandingPage({ user }: { user: User | null }) {
  return (
    <section className="page page-landing">
      <div className="hero-card glass-card">
        <div className="hero-grid-main">
          <div className="hero-copy">
            <span className="eyebrow">Realtime Valorant Duo Client</span>
            <h1>Enter the neon queue and lock your duo through a tactical uplink.</h1>
            <p>
              Pulse Duo now behaves like a futuristic match console: centered command nav,
              live arena routing, cinematic accept flow, and post-confirmation squad intel.
            </p>
            <div className="hero-actions">
              <Link className="primary-button inline-cta" to={user ? "/arena" : "/auth"}>
                {user ? "Open Arena" : "Create Profile"}
              </Link>
              <Link className="ghost-button inline-cta ghost-link" to="/intel">
                View Intel Board
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="reactor-core">
              <div className="reactor-ring ring-one" />
              <div className="reactor-ring ring-two" />
              <div className="reactor-ring ring-three" />
              <div className="reactor-center">
                <span className="tiny-label">Neural sync</span>
                <strong>DUO READY</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-panels">
          <div className="panel-accent">
            <span className="tiny-label">Feature pulse</span>
            <strong>Match-found modal + alert sound</strong>
            <p>Popups feel urgent, visible, and game-like instead of plain app toasts.</p>
          </div>
          <div className="panel-accent">
            <span className="tiny-label">Flow upgrade</span>
            <strong>Home, Auth, Arena, Duo Intel</strong>
            <p>Each route has a clear job so the UI feels intentional and easier to extend.</p>
          </div>
          <div className="panel-accent">
            <span className="tiny-label">Ready state</span>
            <strong>{user ? `${user.username} is armed and ready` : "Sign in to arm your profile"}</strong>
            <p>Once authenticated, jump straight into the arena and start scanning.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthPage({
  user,
  banner,
  busy,
  onSignup,
  onLogin,
}: {
  user: User | null;
  banner: string;
  busy: boolean;
  onSignup: (form: typeof defaultSignup) => Promise<void>;
  onLogin: (form: { email: string; password: string }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [signupForm, setSignupForm] = useState(defaultSignup);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  function toggleRole(role: Role) {
    setSignupForm((current) => {
      const nextRoles = current.preferredRoles.includes(role)
        ? current.preferredRoles.filter((item) => item !== role)
        : [...current.preferredRoles, role];

      return {
        ...current,
        preferredRoles: nextRoles.length ? nextRoles : [role],
      };
    });
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSignup(signupForm);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(loginForm);
  }

  return (
    <section className="page two-col">
      <div className="glass-card auth-story">
        <span className="eyebrow">Agent Setup</span>
        <h2>Profiles tuned for your backend.</h2>
        <p>{banner}</p>
        <div className="story-grid">
          <div>
            <span className="tiny-label">Signup fields</span>
            <strong>Username, rank, region, roles, MMR</strong>
          </div>
          <div>
            <span className="tiny-label">Session model</span>
            <strong>JWT cookie persisted across routes</strong>
          </div>
          <div>
            <span className="tiny-label">Queue prep</span>
            <strong>Profile gets used directly for `/queue/join`</strong>
          </div>
        </div>
      </div>

      <div className="glass-card auth-panel">
        {user ? (
          <div className="signed-card">
            <span className="tiny-label">Current account</span>
            <h3>{user.username}</h3>
            <div className="chip-row">
              <span className="tag">{formatLabel(user.region)}</span>
              <span className="tag">{formatLabel(user.rank)}</span>
              <span className="tag">{user.mmr} MMR</span>
            </div>
            <p className="muted-copy">You’re already authenticated. Head to the Arena route to search for a duo.</p>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")} type="button">
                Create Agent
              </button>
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
                Login
              </button>
            </div>

            {mode === "signup" ? (
              <form className="form-grid" onSubmit={submitSignup}>
                <label>
                  Username
                  <input
                    value={signupForm.username}
                    onChange={(event) => setSignupForm((current) => ({ ...current, username: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>
                <div className="field-row">
                  <label>
                    Region
                    <select
                      value={signupForm.region}
                      onChange={(event) => setSignupForm((current) => ({ ...current, region: event.target.value as Region }))}
                    >
                      {regionOptions.map((region) => (
                        <option key={region} value={region}>
                          {formatLabel(region)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rank
                    <select
                      value={signupForm.rank}
                      onChange={(event) => setSignupForm((current) => ({ ...current, rank: event.target.value as Rank }))}
                    >
                      {rankOptions.map((rank) => (
                        <option key={rank} value={rank}>
                          {formatLabel(rank)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="field-row">
                  <label>
                    MMR
                    <input
                      type="number"
                      min={0}
                      value={signupForm.mmr}
                      onChange={(event) => setSignupForm((current) => ({ ...current, mmr: Number(event.target.value) }))}
                      required
                    />
                  </label>
                  <label>
                    Gender
                    <select
                      value={signupForm.gender}
                      onChange={(event) => setSignupForm((current) => ({ ...current, gender: event.target.value as Gender }))}
                    >
                      {genderOptions.map((gender) => (
                        <option key={gender} value={gender}>
                          {formatLabel(gender)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <span className="tiny-label">Preferred roles</span>
                  <div className="role-grid">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        className={signupForm.preferredRoles.includes(role) ? "role active" : "role"}
                        onClick={() => toggleRole(role)}
                        type="button"
                      >
                        {formatLabel(role)}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="primary-button" disabled={busy} type="submit">
                  {busy ? "Creating..." : "Create account"}
                </button>
              </form>
            ) : (
              <form className="form-grid" onSubmit={submitLogin}>
                <label>
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>
                <button className="primary-button" disabled={busy} type="submit">
                  {busy ? "Connecting..." : "Login"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ArenaPage({
  user,
  pendingMatch,
  queueState,
  busy,
  onJoinQueue,
}: {
  user: User | null;
  pendingMatch: MatchState | null;
  queueState: string;
  busy: boolean;
  onJoinQueue: () => Promise<void>;
}) {
  if (!user) {
    return (
      <section className="page">
        <div className="glass-card empty-panel">
          <h2>Auth required</h2>
          <p>Sign in first, then come back here to enter the duo arena.</p>
          <Link className="primary-button inline-cta" to="/auth">
            Go to auth
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page two-col">
      <div className="glass-card arena-panel">
        <div className="section-head">
          <div>
            <span className="eyebrow">Duo Arena</span>
            <h2>Live search control room</h2>
          </div>
          <span className={`status-pill ${queueState !== "IDLE" ? "hot" : ""}`}>{queueState}</span>
        </div>

        <div className="radar-card">
          <div className="scanner large" />
          <div>
            <span className="tiny-label">Queue engine</span>
            <strong>{queueState === "SEARCHING" ? "Scanning live candidates" : "Ready for deployment"}</strong>
            <p>Join queue to trigger the real-time duo matcher using your stored MMR, region, and profile.</p>
          </div>
        </div>

        <button className="primary-button" disabled={busy || queueState === "SEARCHING"} onClick={onJoinQueue} type="button">
          {queueState === "SEARCHING" ? "Searching..." : "Enter duo queue"}
        </button>
      </div>

      <div className="glass-card player-overview">
        <span className="eyebrow">Operator Snapshot</span>
        <h3>{user.username}</h3>
        <div className="identity-row">
          <span className={`gender-pill ${getGenderMeta(user.gender).tone}`}>
            <span>{getGenderMeta(user.gender).symbol}</span>
            {getGenderMeta(user.gender).label}
          </span>
        </div>
        <div className="stats-grid">
          <div>
            <span className="tiny-label">Rank</span>
            <strong>{formatLabel(user.rank)}</strong>
          </div>
          <div>
            <span className="tiny-label">Region</span>
            <strong>{formatLabel(user.region)}</strong>
          </div>
          <div>
            <span className="tiny-label">MMR</span>
            <strong>{user.mmr}</strong>
          </div>
          <div>
            <span className="tiny-label">Gender</span>
            <strong>{formatLabel(user.gender)}</strong>
          </div>
        </div>
        <div className="chip-row">
          {user.preferredRoles.map((role) => (
            <span className="tag accent" key={role}>
              {formatLabel(role)}
            </span>
          ))}
        </div>
        {pendingMatch?.partner ? (
          <div className="mini-duo">
            <span className="tiny-label">Pending duo</span>
            <strong>{pendingMatch.partner.username}</strong>
            <div className="identity-row">
              <span className={`gender-pill ${getGenderMeta(pendingMatch.partner.gender).tone}`}>
                <span>{getGenderMeta(pendingMatch.partner.gender).symbol}</span>
                {getGenderMeta(pendingMatch.partner.gender).label}
              </span>
            </div>
            <p>{formatLabel(pendingMatch.partner.rank)} • {pendingMatch.partner.mmr} MMR</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function IntelPage({ user, pendingMatch }: { user: User | null; pendingMatch: MatchState | null }) {
  if (!user) {
    return (
      <section className="page">
        <div className="glass-card empty-panel">
          <h2>No intel yet</h2>
          <p>Sign in and lock a duo match to unlock the comparison board.</p>
        </div>
      </section>
    );
  }

  const synergy = calcSynergy(user, pendingMatch?.partner ?? null);

  return (
    <section className="page intel-layout">
      <div className="glass-card intel-hero">
        <div className="section-head">
          <div>
            <span className="eyebrow">Duo Intel</span>
            <h2>{pendingMatch?.partner ? "Your squad breakdown" : "Waiting for duo confirmation"}</h2>
          </div>
          <span className={`status-pill ${pendingMatch?.status === "CONFIRMED" ? "hot" : ""}`}>
            {pendingMatch?.status || "STANDBY"}
          </span>
        </div>

        <div className="synergy-ring">
          <div>
            <span className="tiny-label">Synergy rating</span>
            <strong>{pendingMatch?.partner ? `${synergy}%` : "--"}</strong>
          </div>
        </div>

        <p className="muted-copy">
          After a successful accept flow, this screen highlights both players so the pairing feels rewarding instead of abrupt.
        </p>
      </div>

      <div className="intel-grid">
        <div className="glass-card intel-card">
          <span className="tiny-label">Your stats</span>
          <h3>{user.username}</h3>
          <div className="identity-row">
            <span className={`gender-pill ${getGenderMeta(user.gender).tone}`}>
              <span>{getGenderMeta(user.gender).symbol}</span>
              {getGenderMeta(user.gender).label}
            </span>
          </div>
          <div className="stats-grid">
            <div><span className="tiny-label">Rank</span><strong>{formatLabel(user.rank)}</strong></div>
            <div><span className="tiny-label">MMR</span><strong>{user.mmr}</strong></div>
            <div><span className="tiny-label">Region</span><strong>{formatLabel(user.region)}</strong></div>
            <div><span className="tiny-label">Roles</span><strong>{user.preferredRoles.map(formatLabel).join(", ")}</strong></div>
          </div>
        </div>

        <div className="glass-card intel-card">
          <span className="tiny-label">Duo stats</span>
          <h3>{pendingMatch?.partner?.username || "No duo yet"}</h3>
          {pendingMatch?.partner ? (
            <div className="identity-row">
              <span className={`gender-pill ${getGenderMeta(pendingMatch.partner.gender).tone}`}>
                <span>{getGenderMeta(pendingMatch.partner.gender).symbol}</span>
                {getGenderMeta(pendingMatch.partner.gender).label}
              </span>
            </div>
          ) : null}
          <div className="stats-grid">
            <div><span className="tiny-label">Rank</span><strong>{pendingMatch?.partner ? formatLabel(pendingMatch.partner.rank) : "--"}</strong></div>
            <div><span className="tiny-label">MMR</span><strong>{pendingMatch?.partner?.mmr ?? "--"}</strong></div>
            <div><span className="tiny-label">Region</span><strong>{pendingMatch?.partner ? formatLabel(pendingMatch.partner.region) : "--"}</strong></div>
            <div><span className="tiny-label">Roles</span><strong>{pendingMatch?.partner ? pendingMatch.partner.preferredRoles.map(formatLabel).join(", ") : "--"}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchModal({
  open,
  pendingMatch,
  user,
  busy,
  onAccept,
  onDecline,
  onClose,
}: {
  open: boolean;
  pendingMatch: MatchState | null;
  user: User | null;
  busy: boolean;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onClose: () => void;
}) {
  if (!open || !pendingMatch || !user) return null;

  const synergy = calcSynergy(user, pendingMatch.partner);
  const partner = pendingMatch.partner;
  const selfGender = getGenderMeta(user.gender);
  const partnerGender = partner ? getGenderMeta(partner.gender) : null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="match-modal glass-card" role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
        <button className="modal-close" onClick={onClose} type="button">
          x
        </button>
        <span className="eyebrow">Match Found</span>
        <h2 id="match-modal-title">Your duo is ready to lock in.</h2>
        <p className="muted-copy">
          Accept the offer to confirm the duo. If both players accept, the app opens the intel board with both stat cards.
        </p>

        <div className="modal-versus">
          <div className="operator-card">
            <span className="tiny-label">You</span>
            <strong>{user.username}</strong>
            <span className={`gender-pill ${selfGender.tone}`}>
              <span>{selfGender.symbol}</span>
              {selfGender.label}
            </span>
            <p>{formatLabel(user.rank)} • {user.mmr} MMR</p>
          </div>
          <div className="vs-core">+</div>
          <div className="operator-card accent">
            <span className="tiny-label">Duo</span>
            <strong>{partner?.username || "Pending player"}</strong>
            {partnerGender ? (
              <span className={`gender-pill ${partnerGender.tone}`}>
                <span>{partnerGender.symbol}</span>
                {partnerGender.label}
              </span>
            ) : null}
            <p>{partner ? `${formatLabel(partner.rank)} • ${partner.mmr} MMR` : "Syncing profile"}</p>
          </div>
        </div>

        <div className="modal-stats">
          <div>
            <span className="tiny-label">Synergy</span>
            <strong>{synergy}%</strong>
          </div>
          <div>
            <span className="tiny-label">Accepted</span>
            <strong>{pendingMatch.acceptedUserIds.length}/2</strong>
          </div>
          <div>
            <span className="tiny-label">Average MMR</span>
            <strong>{pendingMatch.averageMMR}</strong>
          </div>
        </div>

        <div className="action-row">
          <button className="primary-button" disabled={busy} onClick={onAccept} type="button">
            Accept Match
          </button>
          <button className="ghost-button" disabled={busy} onClick={onDecline} type="button">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [pendingMatch, setPendingMatch] = useState<MatchState | null>(null);
  const [banner, setBanner] = useState("Create your profile and step into the arena.");
  const [busy, setBusy] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [queueState, setQueueState] = useState<"IDLE" | "SEARCHING" | "MATCH_FOUND" | "CONFIRMED">("IDLE");
  const [modalOpen, setModalOpen] = useState(false);
  const lastAlertedMatch = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    request<{ success: boolean; user: User }>(`${apiBaseUrl}/api/users/me`)
      .then((data) => {
        if (!mounted) return;
        setUser(data.user);
        setBanner(`Welcome back, ${data.user.username}.`);
      })
      .catch(() => {
        if (!mounted) return;
        setBanner("Create your profile and step into the arena.");
      })
      .finally(() => {
        if (mounted) setLoadingUser(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const pollMatch = async () => {
      try {
        const data = await request<{ success: boolean; match: MatchState | null }>(
          `${matchingBaseUrl}/match/pending/${user.id}`,
        );

        setPendingMatch(data.match);

        if (data.match?.status === "PENDING") {
          setQueueState("MATCH_FOUND");
          setBanner(`Match found with ${data.match.partner?.username || "another player"}.`);
        } else if (data.match?.status === "CONFIRMED") {
          setQueueState("CONFIRMED");
          setModalOpen(false);
          setBanner(`Duo confirmed with ${data.match.partner?.username || "your teammate"}.`);
          navigate("/intel");
        } else if (!data.match && queueState === "MATCH_FOUND") {
          setQueueState("SEARCHING");
        }
      } catch {
        setPendingMatch(null);
      }
    };

    void pollMatch();

    const poll = window.setInterval(pollMatch, 2500);

    return () => window.clearInterval(poll);
  }, [navigate, queueState, user]);

  useEffect(() => {
    if (!pendingMatch || pendingMatch.status !== "PENDING") return;
    if (lastAlertedMatch.current === pendingMatch.id) return;

    lastAlertedMatch.current = pendingMatch.id;
    setModalOpen(true);
    playAlertSound();
  }, [pendingMatch]);

  async function handleSignup(form: typeof defaultSignup) {
    setBusy(true);
    try {
      const data = await request<{ success: boolean; user: User }>(`${apiBaseUrl}/api/users/signup`, {
        method: "POST",
        body: JSON.stringify(form),
      });

      setUser(data.user);
      setBanner(`Profile synced for ${data.user.username}.`);
      navigate("/arena");
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unable to sign up");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(form: { email: string; password: string }) {
    setBusy(true);
    try {
      const data = await request<{ success: boolean; user: User }>(`${apiBaseUrl}/api/users/login`, {
        method: "POST",
        body: JSON.stringify(form),
      });

      setUser(data.user);
      setBanner(`Synced with ${data.user.username}.`);
      navigate("/arena");
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unable to log in");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinQueue() {
    if (!user) return;
    setBusy(true);
    try {
      await request<{ success: boolean; message: string }>(`${matchingBaseUrl}/queue/join`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.id,
          mmr: user.mmr,
          region: user.region,
        }),
      });

      setQueueState("SEARCHING");
      setPendingMatch(null);
      lastAlertedMatch.current = null;
      setBanner("You entered the queue. Radar is active.");
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unable to join queue");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    if (!pendingMatch || !user) return;
    setBusy(true);
    try {
      const data = await request<{ message: string }>(`${matchingBaseUrl}/match/accept`, {
        method: "POST",
        body: JSON.stringify({
          matchId: pendingMatch.id,
          userId: user.id,
        }),
      });

      setBanner(data.message);

      const latest = await request<{ success: boolean; match: MatchState | null }>(
        `${matchingBaseUrl}/match/pending/${user.id}`,
      );

      setPendingMatch(latest.match);
      if (latest.match?.status === "CONFIRMED") {
        setQueueState("CONFIRMED");
        setModalOpen(false);
        navigate("/intel");
      }
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unable to accept");
    } finally {
      setBusy(false);
    }
  }

  async function handleDecline() {
    if (!pendingMatch) return;
    setBusy(true);
    try {
      const data = await request<{ message: string }>(`${matchingBaseUrl}/match/decline`, {
        method: "POST",
        body: JSON.stringify({ matchId: pendingMatch.id }),
      });

      setPendingMatch(null);
      setQueueState("SEARCHING");
      setModalOpen(false);
      setBanner(data.message);
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Unable to decline");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await request(`${apiBaseUrl}/api/users/logout`, { method: "POST" });
    setUser(null);
    setPendingMatch(null);
    setQueueState("IDLE");
    setModalOpen(false);
    setBanner("Signed out.");
    navigate("/auth");
  }

  const queueLabel = useMemo(() => {
    if (loadingUser) return "BOOTING";
    return queueState;
  }, [loadingUser, queueState]);

  return (
    <>
      <AppShell user={user} onLogout={handleLogout} queueState={queueLabel}>
        <header className="topbar">
          <div>
            <span className="tiny-label">System message</span>
            <strong>{banner}</strong>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/auth" element={<AuthPage user={user} banner={banner} busy={busy} onSignup={handleSignup} onLogin={handleLogin} />} />
          <Route path="/arena" element={<ArenaPage user={user} pendingMatch={pendingMatch} queueState={queueLabel} busy={busy} onJoinQueue={handleJoinQueue} />} />
          <Route path="/intel" element={<IntelPage user={user} pendingMatch={pendingMatch} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      <MatchModal
        open={modalOpen}
        pendingMatch={pendingMatch}
        user={user}
        busy={busy}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
