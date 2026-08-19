import express from "express";
import { listProjects, getProject, listProjectTasks } from "./controller.js";
const projects = express.Router();
projects.get("/", listProjects);
projects.get("/:id", getProject);
projects.get(":id/tasks", listProjectTasks);
export default projects;
