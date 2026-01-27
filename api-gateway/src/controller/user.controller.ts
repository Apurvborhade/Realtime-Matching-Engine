import { hashPassword, comparePassword } from "../utils/auth";
import { AppError } from "../utils/AppError";
import { createUser, generateToken, verifyToken } from "../services/auth.service";
import { prisma } from "../lib/prisma";

async function createUserController(req: any, res: any, next: any) {
  const { name, email, password, rating, skills } = req.body;
  try {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const hashedPassword = await hashPassword(password);

    // Create User Service
    const user = await createUser(
      name,
      hashedPassword,
      email,
      rating,
      skills
    );

    const token = await generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    })

    res.status(201).json({ success: true, user, message: "User created" });
  } catch (error) {
    next(error);
  }
}

async function loginUserController(req: any, res: any, next: any) {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = await generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    })

    res.status(200).json({ success: true, user, message: "Login successful" });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUserController(req: any, res: any, next: any) {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const userPayload = await verifyToken(token);

    res.status(200).json({ success: true, user: userPayload });
  } catch (error) {
    next(error);
  }

}

async function logoutUserController(req: any, res: any, next: any) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    next(error);
  }
}


export {
  createUserController,
  loginUserController,
  getCurrentUserController,
  logoutUserController
};