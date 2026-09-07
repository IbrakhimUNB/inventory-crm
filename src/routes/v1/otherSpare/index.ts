import express, { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import {
  getOtherSpares,
  getOtherSparePhoto,
  addOtherSpare,
  updateOtherSpare,
  deleteOtherSpare,
} from "./controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  addOtherSpareSchema,
  updateOtherSpareSchema,
  idParamSchema,
} from "./validator.js";
const otherSpare: Router = express.Router();

// Every otherSpare route requires an authenticated user
otherSpare.use(authMiddleware);

// The add endpoint submits its payload (including the `photo` image) as
// `multipart/form-data` and stores the image bytes directly in the DB.
const upload = multer({ storage: multer.memoryStorage() });
const uploadPhoto = upload.single("photo");
otherSpare.get("/", getOtherSpares);
otherSpare.get("/:id/photo", getOtherSparePhoto);
otherSpare.post(
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
  validateRequest(addOtherSpareSchema),
  addOtherSpare,
);
otherSpare.patch(
  "/:id",
  validateRequest(idParamSchema, "params"),
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
  validateRequest(updateOtherSpareSchema),
  updateOtherSpare,
);
otherSpare.delete(
  "/:id",
  validateRequest(idParamSchema, "params"),
  deleteOtherSpare,
);

export default otherSpare;
