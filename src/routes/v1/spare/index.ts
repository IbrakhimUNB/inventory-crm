import express, { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { getSpares, addSpare, deleteSpare } from "./controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { addSpareSchema, deleteSpareParamsSchema } from "./validator.js";
const spare: Router = express.Router();

// Every spare route requires an authenticated user
spare.use(authMiddleware);

// The aggregate add endpoint accepts a `multipart/form-data` body containing a
// `type` discriminator, type-specific scalar fields, and an uploaded `photo`.
const upload = multer({ storage: multer.memoryStorage() });
const uploadPhoto = upload.single("photo");

spare.get("/", getSpares);
spare.post(
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
  validateRequest(addSpareSchema),
  addSpare,
);
spare.delete(
  "/:type/:id",
  validateRequest(deleteSpareParamsSchema, "params"),
  deleteSpare,
);

export default spare;
