import { Request, Response } from "express";
import { prisma } from "../../../prisma.js";
import { Category } from "../../../generated/prisma/enums.js";

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
 * Helper to convert a stored Bytes value back to a base64 string for JSON responses.
 */
const photoToBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString("base64");
const getSpareMotors = async (_req: Request, res: Response) => {
  try {
    const spareMotors = await prisma.spareMotor.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Convert binary photos to base64 so clients can render them
    const results = spareMotors.map(({ photo, ...item }) => ({
      ...item,
      photo: photoToBase64(photo),
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

const addSpareMotor = async (req: Request, res: Response) => {
  try {
    const { name, carModel, category, price, km, description, photo } =
      req.body;

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
        photo: parsePhotoBuffer(photo),
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        spareMotor: {
          ...spareMotor,
          photo: photoToBase64(spareMotor.photo),
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
          ...updatedItem,
          photo: photoToBase64(updatedItem.photo),
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

export { getSpareMotors, addSpareMotor, updateSpareMotor, deleteSpareMotor };
