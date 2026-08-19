import express from "express";
import { register } from "./controller.js";
const auth = express.Router();
auth.post("/register", register);
export default auth;
