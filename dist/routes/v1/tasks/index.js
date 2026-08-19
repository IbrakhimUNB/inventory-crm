import express from "express";
import { listTasks, getTask } from "./controller.js";
const tasks = express.Router();
tasks.get("/", listTasks);
tasks.get("/:id", getTask);
export default tasks;
