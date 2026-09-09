import { Request, Response } from "express";
import { prisma } from "../../../prisma.js";
import { Category } from "../../../generated/prisma/enums.js";

// `req.file` is populated by multer on multipart routes.
type MulterRequest = Request & { file?: Express.Multer.File };

/** Convert a binary Buffer from an uploaded file into a Prisma Bytes value. */
const fileToPhotoBytes = (buffer: Buffer): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(buffer);

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

const getOtherSpares = async (req: Request, res: Response) => {
  try {
    const items = await prisma.other.findMany({
      orderBy: { createdAt: "desc" },
    });

    const results = items.map(({ photo, ...item }) => ({
      ...item,
      photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${item.id}/photo`,
    }));

    res.status(200).json({
      status: "success",
      data: {
        otherSpares: results,
      },
    });
  } catch (error) {
    console.error("Error fetching other spare items:", error);
    res.status(500).json({ error: "Failed to fetch other spare items" });
  }
};

/** Stream the stored binary photo bytes for a single other spare item. */
const getOtherSparePhoto = async (req: Request, res: Response) => {
  try {
    const item = await prisma.other.findUnique({
      where: { id: req.params.id },
      select: { photo: true },
    });

    if (!item) {
      res.status(404).json({ error: "Other spare item not found" });
      return;
    }

    const buffer = Buffer.from(item.photo);
    res.setHeader("Content-Type", detectImageType(item.photo));
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error) {
    console.error("Error fetching other spare photo:", error);
    res.status(500).json({ error: "Failed to fetch other spare photo" });
  }
};

const addOtherSpare = async (req: Request, res: Response) => {
  try {
    const { name, carModel, category, price, description } = req.body;
    const photoFile = (req as MulterRequest).file;

    if (!photoFile) {
      res.status(400).json({ error: "A photo image file is required" });
      return;
    }

    const item = await prisma.other.create({
      data: {
        name: String(name).toUpperCase(),
        carModel: String(carModel).toUpperCase(),
        category: category as Category,
        price: Number(price),
        description,
        photo: fileToPhotoBytes(photoFile.buffer),
      },
    });

    const { photo: _photo, ...rest } = item;
    res.status(201).json({
      status: "success",
      data: {
        otherSpare: {
          ...rest,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${item.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error adding other spare:", error);
    res.status(500).json({ error: "Failed to add other spare" });
  }
};

const updateOtherSpare = async (req: Request, res: Response) => {
  try {
    const { name, carModel, category, price, description } = req.body;
    const photoFile = (req as MulterRequest).file;

    const item = await prisma.other.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      res.status(404).json({ error: "Other spare item not found" });
      return;
    }

    const updateData: {
      name?: string;
      carModel?: string;
      category?: Category;
      price?: number;
      description?: string;
      photo?: Uint8Array<ArrayBuffer>;
    } = {};

    if (name !== undefined) updateData.name = String(name).toUpperCase();
    if (carModel !== undefined)
      updateData.carModel = String(carModel).toUpperCase();
    if (category !== undefined) updateData.category = category as Category;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (photoFile) updateData.photo = fileToPhotoBytes(photoFile.buffer);

    if (Object.keys(updateData).length === 0) {
      res
        .status(400)
        .json({ error: "At least one field is required to update" });
      return;
    }

    const updatedItem = await prisma.other.update({
      where: { id: req.params.id },
      data: updateData,
    });

    const { photo: _photo, ...rest } = updatedItem;
    res.status(200).json({
      status: "success",
      data: {
        otherSpare: {
          ...rest,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${updatedItem.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error updating other spare:", error);
    res.status(500).json({ error: "Failed to update other spare" });
  }
};

const deleteOtherSpare = async (req: Request, res: Response) => {
  try {
    const item = await prisma.other.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      res.status(404).json({ error: "Other spare item not found" });
      return;
    }

    await prisma.other.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      status: "success",
      message: "Other spare item deleted",
    });
  } catch (error) {
    console.error("Error deleting other spare:", error);
    res.status(500).json({ error: "Failed to delete other spare" });
  }
};

export {
  getOtherSpares,
  getOtherSparePhoto,
  addOtherSpare,
  updateOtherSpare,
  deleteOtherSpare,
};
