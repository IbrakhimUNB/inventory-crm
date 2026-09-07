import express, { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import {
  getSpareMotors,
  getSpareMotorPhoto,
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

// The add endpoint submits its payload (including the `photo` image) as
// `multipart/form-data`. Multer parses the multipart body into the text fields
// (req.body) and the uploaded file (req.file). Memory storage is used because
// the image bytes are stored directly in the DB as Prisma `Bytes`, not on disk.
const upload = multer({ storage: multer.memoryStorage() });
const uploadPhoto = upload.single("photo");
spareMotor.get("/", getSpareMotors);
spareMotor.get("/:id/photo", getSpareMotorPhoto);
spareMotor.post(
  "/add",
  (req: Request, res: Response, next: NextFunction) => {
    const contentType = (req.headers["content-type"] || "").toLowerCase();
    if (!contentType.startsWith("multipart/form-data")) {
      res
        .status(415)
        .json({ error: "Content-Type must be multipart/form-data" });
      return;
    }
    next();
  },
  uploadPhoto,
  validateRequest(addSpareMotorSchema),
  addSpareMotor,
);
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
