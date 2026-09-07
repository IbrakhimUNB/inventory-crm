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

const getSpareTires = async (req: Request, res: Response) => {
  try {
    const tires = await prisma.tire.findMany({
      orderBy: { createdAt: "desc" },
    });

    const results = tires.map(({ photo, ...item }) => ({
      ...item,
      photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${item.id}/photo`,
    }));

    res.status(200).json({
      status: "success",
      data: {
        spareTires: results,
      },
    });
  } catch (error) {
    console.error("Error fetching spare tires:", error);
    res.status(500).json({ error: "Failed to fetch spare tires" });
  }
};

/** Stream the stored binary photo bytes for a single spare tire. */
const getSpareTirePhoto = async (req: Request, res: Response) => {
  try {
    const tire = await prisma.tire.findUnique({
      where: { id: req.params.id },
      select: { photo: true },
    });

    if (!tire) {
      res.status(404).json({ error: "Spare tire not found" });
      return;
    }

    const buffer = Buffer.from(tire.photo);
    res.setHeader("Content-Type", detectImageType(tire.photo));
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (error) {
    console.error("Error fetching spare tire photo:", error);
    res.status(500).json({ error: "Failed to fetch spare tire photo" });
  }
};

const addSpareTire = async (req: Request, res: Response) => {
  try {
    const { name, size, category, price, description, quantity } = req.body;
    const photoFile = (req as MulterRequest).file;

    if (!photoFile) {
      res.status(400).json({ error: "A photo image file is required" });
      return;
    }

    // Check if already added (unique by name)
    const existing = await prisma.tire.findFirst({
      where: { name: String(name).toUpperCase() },
    });

    if (existing) {
      res
        .status(400)
        .json({ error: "Spare tire with this name already exists" });
      return;
    }

    const tire = await prisma.tire.create({
      data: {
        name: String(name).toUpperCase(),
        size: Number(size),
        category: category as Category,
        price: Number(price),
        description,
        quantity: Number(quantity),
        photo: fileToPhotoBytes(photoFile.buffer),
      },
    });

    const { photo: _photo, ...rest } = tire;
    res.status(201).json({
      status: "success",
      data: {
        spareTire: {
          ...rest,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${tire.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error adding spare tire:", error);
    res.status(500).json({ error: "Failed to add spare tire" });
  }
};

const updateSpareTire = async (req: Request, res: Response) => {
  try {
    const { name, size, category, price, description, quantity } = req.body;
    const photoFile = (req as MulterRequest).file;

    const tire = await prisma.tire.findUnique({
      where: { id: req.params.id },
    });

    if (!tire) {
      res.status(404).json({ error: "Spare tire not found" });
      return;
    }

    const updateData: {
      name?: string;
      size?: number;
      category?: Category;
      price?: number;
      description?: string;
      quantity?: number;
      photo?: Uint8Array<ArrayBuffer>;
    } = {};

    if (name !== undefined) updateData.name = String(name).toUpperCase();
    if (size !== undefined) updateData.size = Number(size);
    if (category !== undefined) updateData.category = category as Category;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (photoFile) updateData.photo = fileToPhotoBytes(photoFile.buffer);

    if (Object.keys(updateData).length === 0) {
      res
        .status(400)
        .json({ error: "At least one field is required to update" });
      return;
    }

    const updatedItem = await prisma.tire.update({
      where: { id: req.params.id },
      data: updateData,
    });

    const { photo: _photo, ...rest } = updatedItem;
    res.status(200).json({
      status: "success",
      data: {
        spareTire: {
          ...rest,
          photoUrl: `${req.protocol}://${req.get("host")}${req.baseUrl}/${updatedItem.id}/photo`,
        },
      },
    });
  } catch (error) {
    console.error("Error updating spare tire:", error);
    res.status(500).json({ error: "Failed to update spare tire" });
  }
};

const deleteSpareTire = async (req: Request, res: Response) => {
  try {
    const tire = await prisma.tire.findUnique({
      where: { id: req.params.id },
    });

    if (!tire) {
      res.status(404).json({ error: "Spare tire not found" });
      return;
    }

    await prisma.tire.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      status: "success",
      message: "Spare tire deleted",
    });
  } catch (error) {
    console.error("Error deleting spare tire:", error);
    res.status(500).json({ error: "Failed to delete spare tire" });
  }
};

export {
  getSpareTires,
  getSpareTirePhoto,
  addSpareTire,
  updateSpareTire,
  deleteSpareTire,
};
