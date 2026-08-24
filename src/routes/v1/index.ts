import express, { Router } from "express";
import tasks from "./tasks/index.js";
import watchlist from "./watchlist/index.js";
import spareMotor from "./spareMotor/index.js";
import auth from "./auth/index.js";

const v1: Router = express.Router();

v1.use("/tasks", tasks);
v1.use("/watchlist", watchlist);
v1.use("/spare-motor", spareMotor);
v1.use("/auth", auth);

export default v1;
