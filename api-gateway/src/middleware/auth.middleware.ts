import { verifyToken } from "../services/auth.service";

export async function userAuthenticated(req: any, res: any, next: any) {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error("Unauthorized");
    }

    const userPayload = await verifyToken(token);
    req.user = userPayload;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
} 