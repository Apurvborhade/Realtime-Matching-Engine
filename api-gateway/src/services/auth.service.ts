import { prisma } from "../lib/prisma";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export interface UserPayload {
    id: string;
    name: string;
    email: string;
    rating: number;
    skills: string;
}
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function createUser(name:string, hashedPassword:string, email:string,rating:number,skills:string): Promise<any> {
    return prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            rating,
            skills
        }
    });
}

export async function generateToken(payload:UserPayload): Promise<string> {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
}

export async function verifyToken(token: string): Promise<UserPayload> {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
}