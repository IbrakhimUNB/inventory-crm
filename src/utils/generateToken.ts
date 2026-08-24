import { Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (() => {
    throw new Error("JWT_SECRET environment variable is not defined");
  })();

const generateToken = (userId: string, res: Response): string => {
  const payload = { id: userId };
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  const token = jwt.sign(payload, JWT_SECRET, options);
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return token;
};

export default generateToken;
