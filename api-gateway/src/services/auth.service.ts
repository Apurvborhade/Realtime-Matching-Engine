import { prisma } from "../lib/prisma";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export interface UserPayload {
    id: string;
    username: string;
    email: string;
    region: string;
    rank: string;
    mmr: number;
    preferredRoles: string[];
}

export interface CreateUserInput {
    username: string;
    email: string;
    passwordHash: string;
    region: string;
    rank: string;
    preferredRoles: string[];
    mmr?: number;
}
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function createUser(data: CreateUserInput): Promise<any> {
    return prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            passwordHash: data.passwordHash,
            region: data.region as any,
            rank: data.rank as any,
            preferredRoles: data.preferredRoles as any,
            mmr: data.mmr
        },
        select: {
            id: true,
            username: true,
            email: true,
            region: true,
            rank: true,
            mmr: true,
            preferredRoles: true,
            createdAt: true
        }
    });
}

export async function generateToken(payload:UserPayload): Promise<string> {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });
}

export async function verifyToken(token: string): Promise<UserPayload> {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
}