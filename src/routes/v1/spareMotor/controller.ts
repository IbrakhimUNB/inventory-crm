import { Request, Response } from "express";
import { prisma } from "../../../prisma.js";
import { Category } from "../../../generated/prisma/enums.js";

// `req.file` is populated by multer on multipart routes.
type MulterRequest = Request & { file?: Express.Multer.File };

/** Convert a binary Buffer from an uploaded file into a Prisma Bytes value. */
const fileToPhotoBytes = (buffer: Buffer): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(buffer);

/**
 * Helper to decode a base64 image string into a Buffer.
 * Accepts both a plain base64 string and a data-URL like
 * "data:image/png;base64,...."
 */
const parsePhotoBuffer = (photo: string): Uint8Array<ArrayBuffer> => {
  const base64 = photo.includes(",") ? photo.split(",")[1] : photo;
  // Uint8Array.from guarantees an ArrayBuffer-backed result, which matches
  // Prisma's `Bytes` field type (Uint8Array<ArrayBuffer>).
  return Uint8Array.from(Buffer.from(base64, "base64"));
};

/**
 * Guess the image Content-Type from the leading bytes (magic number) of a
 * stored photo so it can be served back to the browser correctly.
 */
const detectImageType = (bytes: Uint8Array): string => {
  const b = Buffer.from(bytes);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "image/jpeg";
  if (b.length >= 8 && b.toString("ascii", 0, 8) === "\x89PNG\r\n\x1a\n")
    return "image/png";
  if (
    b.length >= 6 &&
    (b.toString("ascii", 0, 6) === "GIF87a" ||
      b.toString("ascii", 0, 6) === "GIF89a")
  )
    return "image/gif";
  if (
    b.length >= 12 &&
    b.subarray(0, 4).toString("ascii") === "RIFF" &&
    b.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  return "application/octet-stream";
};

const getSpareMotors = async (req: Request, res: Response) => {
  try {
    const spareMotors = await prisma.spareMotor.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Return a link to each stored photo rather than embedding the image bytes.
    const results = spareMotors.map(({ photo, ...item }) => ({
      ...item,
      photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${item.id}/photo`,
    }));

    res.status(200).json({
      status: "success",
      data: {
        spareMotors: results,
      },
    });
  } catch (error) {
    console.error("Error fetching spare motors:", error);
    res.status(500).json({ error: "Failed to fetch spare motors" });
  }
};

/** Stream the stored binary photo bytes for a single spare motor. */
const getSpareMotorPhoto = async (req: Request, res: Response) => {
  try {
    const spareMotor = await prisma.spareMotor.findUnique({
      where: { id: req.params.id },
      select: { photo: true },
    });

    if (!spareMotor) {
      res.status(404).json({ error: "Spare motor not found" });
      return;
    }

    const buffer = Buffer.from(spareMotor.photo);
    res.setHeader("Content-Type", detectImageType(spareMotor.photo));
    res.setHeader("Content-Length", buffer.length);
    // Let clients cache the image; it is immutable per row id.
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error) {
    console.error("Error fetching spare motor photo:", error);
    res.status(500).json({ error: "Failed to fetch spare motor photo" });
  }
};

const addSpareMotor = async (req: Request, res: Response) => {
  try {
    const { name, carModel, category, price, km, description } = req.body;
    const photoFile = (req as MulterRequest).file;

    // multipart/form-data: the photo is submitted as an uploaded `photo` file
    if (!photoFile) {
      res.status(400).json({ error: "A photo image file is required" });
      return;
    }

    // Check if already added (unique by name)
    const existing = await prisma.spareMotor.findFirst({
      where: { name: String(name).toUpperCase() },
    });

    if (existing) {
      res
        .status(400)
        .json({ error: "Spare motor with this name already exists" });
      return;
    }

    const spareMotor = await prisma.spareMotor.create({
      data: {
        name: String(name).toUpperCase(),
        carModel: String(carModel).toUpperCase(),
        category: category as Category,
        price: Number(price),
        km: Number(km),
        description,
        photo: fileToPhotoBytes(photoFile.buffer),
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        spareMotor: {
          id: spareMotor.id,
          name: spareMotor.name,
          carModel: spareMotor.carModel,
          category: spareMotor.category,
          price: spareMotor.price,
          km: spareMotor.km,
          description: spareMotor.description,
          createdAt: spareMotor.createdAt,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${spareMotor.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error adding spare motor:", error);
    res.status(500).json({ error: "Failed to add spare motor" });
  }
};

const updateSpareMotor = async (req: Request, res: Response) => {
  try {
    const { name, carModel, category, price, km, description, photo } =
      req.body;

    // Find the spare motor
    const spareMotor = await prisma.spareMotor.findUnique({
      where: { id: req.params.id },
    });

    if (!spareMotor) {
      res.status(404).json({ error: "Spare motor not found" });
      return;
    }

    // Build update data
    const updateData: {
      name?: string;
      carModel?: string;
      category?: Category;
      price?: number;
      km?: number;
      description?: string;
      photo?: Uint8Array<ArrayBuffer>;
    } = {};

    if (name !== undefined) updateData.name = String(name).toUpperCase();
    if (carModel !== undefined)
      updateData.carModel = String(carModel).toUpperCase();
    if (category !== undefined) updateData.category = category as Category;
    if (price !== undefined) updateData.price = Number(price);
    if (km !== undefined) updateData.km = Number(km);
    if (description !== undefined) updateData.description = description;
    if (photo !== undefined) updateData.photo = parsePhotoBuffer(photo);

    // Update the spare motor
    const updatedItem = await prisma.spareMotor.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      data: {
        spareMotor: {
          id: updatedItem.id,
          name: updatedItem.name,
          carModel: updatedItem.carModel,
          category: updatedItem.category,
          price: updatedItem.price,
          km: updatedItem.km,
          description: updatedItem.description,
          createdAt: updatedItem.createdAt,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${updatedItem.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error updating spare motor:", error);
    res.status(500).json({ error: "Failed to update spare motor" });
  }
};

const deleteSpareMotor = async (req: Request, res: Response) => {
  try {
    const spareMotor = await prisma.spareMotor.findUnique({
      where: { id: req.params.id },
    });

    if (!spareMotor) {
      res.status(404).json({ error: "Spare motor not found" });
      return;
    }

    await prisma.spareMotor.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      status: "success",
      message: "Spare motor deleted",
    });
  } catch (error) {
    console.error("Error deleting spare motor:", error);
    res.status(500).json({ error: "Failed to delete spare motor" });
  }
};

export {
  getSpareMotors,
  getSpareMotorPhoto,
  addSpareMotor,
  updateSpareMotor,
  deleteSpareMotor,
};
