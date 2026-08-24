import express, { Router } from "express";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import {
  getSpareMotors,
  addSpareMotor,
  updateSpareMotor,
  deleteSpareMotor,
} from "./controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  addSpareMotorSchema,
  updateSpareMotorSchema,
  idParamSchema,
} from "./validator.js";
const spareMotor: Router = express.Router();

// Every spareMotor route requires an authenticated user
spareMotor.use(authMiddleware);

spareMotor.get("/", getSpareMotors);
spareMotor.post("/add", validateRequest(addSpareMotorSchema), addSpareMotor);
spareMotor.patch(
  "/:id",
  validateRequest(idParamSchema, "params"),
  validateRequest(updateSpareMotorSchema),
  updateSpareMotor,
);
spareMotor.delete(
  "/:id",
  validateRequest(idParamSchema, "params"),
  deleteSpareMotor,
);

export default spareMotor;
