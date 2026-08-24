import express, { Router } from "express";
import { register, login, logout } from "./controller.js";

const auth: Router = express.Router();

auth.post("/register", register);
auth.post("/login", login);
auth.get("/logout", logout);

export default auth;
