import express, { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import {
  getSpareTires,
  getSpareTirePhoto,
  addSpareTire,
  updateSpareTire,
  deleteSpareTire,
} from "./controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  addSpareTireSchema,
  updateSpareTireSchema,
  idParamSchema,
} from "./validator.js";
const spareTire: Router = express.Router();

// Every spareTire route requires an authenticated user
spareTire.use(authMiddleware);

// The add endpoint submits its payload (including the `photo` image) as
// `multipart/form-data` and stores the image bytes directly in the DB.
const upload = multer({ storage: multer.memoryStorage() });
const uploadPhoto = upload.single("photo");
spareTire.get("/", getSpareTires);
spareTire.get("/:id/photo", getSpareTirePhoto);
spareTire.post(
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
  validateRequest(addSpareTireSchema),
  addSpareTire,
);
spareTire.patch(
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
  validateRequest(updateSpareTireSchema),
  updateSpareTire,
);
spareTire.delete(
  "/:id",
  validateRequest(idParamSchema, "params"),
  deleteSpareTire,
);

export default spareTire;
