/*
  Warnings:

  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" "Gender" NOT NULL;

-- CreateTable
CREATE TABLE "MatchPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredGender" "Gender",
    "preferredRole" "Role",
    "minRank" "Rank",
    "maxRank" "Rank",

    CONSTRAINT "MatchPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchPreference_userId_key" ON "MatchPreference"("userId");

-- AddForeignKey
ALTER TABLE "MatchPreference" ADD CONSTRAINT "MatchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
