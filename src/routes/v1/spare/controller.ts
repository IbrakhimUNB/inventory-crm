import { Request, Response } from "express";
import { prisma } from "../../../prisma.js";
import { Category } from "../../../generated/prisma/enums.js";

// `req.file` is populated by multer on multipart routes.
type MulterRequest = Request & { file?: Express.Multer.File };

/** Supported item kinds inside the aggregated spare page. */
type SpareKind = "motor" | "tire" | "other";

/** Convert a binary Buffer from an uploaded file into a Prisma Bytes value. */
const fileToPhotoBytes = (buffer: Buffer): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(buffer);

/** Standardize an item's kind and photo reference for the aggregated lists. */
const toItemPayload = <T extends { id: string }>(
  origin: string,
  kind: SpareKind,
  item: Omit<T, "photo"> & { photo?: unknown },
) => {
  const { photo: _photo, ...itemWithoutPhoto } = item;
  return {
    ...itemWithoutPhoto,
    kind,
    photoUrl: `${origin}/v1/${PHOTO_BASE[kind]}/${(item as { id: string }).id}/photo`,
  };
};

// Path prefix of each sub-resource that hosts that kind's photo.
const PHOTO_BASE: Record<SpareKind, string> = {
  motor: "spare-motor",
  tire: "spare-tire",
  other: "other-spare",
};

/** Aggregate list: spare motors, spare tires and other spare items. */
const getSpares = async (req: Request, res: Response) => {
  try {
    const origin = `${req.protocol}://${req.get("host")}`;

    const [motors, tires, others] = await Promise.all([
      prisma.spareMotor.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.tire.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.other.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        spareMotors: motors.map((item) => toItemPayload(origin, "motor", item)),
        spareTires: tires.map((item) => toItemPayload(origin, "tire", item)),
        otherSpares: others.map((item) => toItemPayload(origin, "other", item)),
      },
    });
  } catch (error) {
    console.error("Error fetching spared items:", error);
    res.status(500).json({ error: "Failed to fetch spared items" });
  }
};

/** Add an item to one of the aggregated lists based on `type`. */
const addSpare = async (req: Request, res: Response) => {
  try {
    const photoFile = (req as MulterRequest).file;
    if (!photoFile) {
      res.status(400).json({ error: "A photo image file is required" });
      return;
    }

    const type = req.body.type as SpareKind;
    const name = String(req.body.name).toUpperCase();
    const category = req.body.category as Category;
    const price = Number(req.body.price);
    const description = req.body.description;

    // Duplicate check happens per target list (mirrors the per-page add).
    const origin = `${req.protocol}://${req.get("host")}`;
    let created;
    let kind: SpareKind;

    switch (type) {
      case "motor": {
        const existing = await prisma.spareMotor.findFirst({
          where: { name },
        });
        if (existing) {
          res
            .status(400)
            .json({ error: "Spare motor with this name already exists" });
          return;
        }
        created = await prisma.spareMotor.create({
          data: {
            name,
            carModel: String(req.body.carModel).toUpperCase(),
            category,
            price,
            km: Number(req.body.km),
            description,
            photo: fileToPhotoBytes(photoFile.buffer),
          },
        });
        kind = "motor";
        break;
      }
      case "tire": {
        const existing = await prisma.tire.findFirst({
          where: { name },
        });
        if (existing) {
          res
            .status(400)
            .json({ error: "Spare tire with this name already exists" });
          return;
        }
        created = await prisma.tire.create({
          data: {
            name,
            size: Number(req.body.size),
            category,
            price,
            description,
            quantity: Number(req.body.quantity),
            photo: fileToPhotoBytes(photoFile.buffer),
          },
        });
        kind = "tire";
        break;
      }
      case "other": {
        const existing = await prisma.other.findFirst({
          where: { name },
        });
        if (existing) {
          res
            .status(400)
            .json({ error: "Other spare item with this name already exists" });
          return;
        }
        created = await prisma.other.create({
          data: {
            name,
            carModel: String(req.body.carModel).toUpperCase(),
            category,
            price,
            description,
            photo: fileToPhotoBytes(photoFile.buffer),
          },
        });
        kind = "other";
        break;
      }
      default: {
        res.status(400).json({ error: "Invalid spare type" });
        return;
      }
    }

    res.status(201).json({
      status: "success",
      data: { spare: toItemPayload(origin, kind, created) },
    });
  } catch (error) {
    console.error("Error adding spare item:", error);
    res.status(500).json({ error: "Failed to add spare item" });
  }
};

/** Delete an item from one of the aggregated lists by type + id. */
const deleteSpare = async (req: Request, res: Response) => {
  try {
    const { type, id } = req.params as { type: SpareKind; id: string };

    if (type === "motor") {
      const item = await prisma.spareMotor.findUnique({ where: { id } });
      if (!item) {
        res.status(404).json({ error: "Spare motor not found" });
        return;
      }
      await prisma.spareMotor.delete({ where: { id } });
    } else if (type === "tire") {
      const item = await prisma.tire.findUnique({ where: { id } });
      if (!item) {
        res.status(404).json({ error: "Spare tire not found" });
        return;
      }
      await prisma.tire.delete({ where: { id } });
    } else if (type === "other") {
      const item = await prisma.other.findUnique({ where: { id } });
      if (!item) {
        res.status(404).json({ error: "Other spare item not found" });
        return;
      }
      await prisma.other.delete({ where: { id } });
    } else {
      res.status(400).json({ error: "Invalid spare type" });
      return;
    }

    res.status(200).json({
      status: "success",
      message: `${type} spare item deleted`,
    });
  } catch (error) {
    console.error("Error deleting spare item:", error);
    res.status(500).json({ error: "Failed to delete spare item" });
  }
};

export { getSpares, addSpare, deleteSpare };
