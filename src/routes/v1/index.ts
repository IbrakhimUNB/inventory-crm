import express, { Router } from "express";
import spare from "./spare/index.js";
import spareMotor from "./spareMotor/index.js";
import spareTire from "./spareTire/index.js";
import otherSpare from "./otherSpare/index.js";
import auth from "./auth/index.js";

const v1: Router = express.Router();

v1.use("/spare", spare);
v1.use("/spare-motor", spareMotor);
v1.use("/spare-tire", spareTire);
v1.use("/other-spare", otherSpare);
v1.use("/auth", auth);

export default v1;
