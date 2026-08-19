import express, { Router } from "express";
import { register } from "./controller.js";

const auth: Router = express.Router();

auth.post("/register", register);

export default auth;
