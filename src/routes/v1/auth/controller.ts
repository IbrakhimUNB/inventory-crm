import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma.js";

// POST /v1/auth/register
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "name, email and password are required" });
    return;
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
