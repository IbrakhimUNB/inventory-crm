import { z } from "zod";

// Allowed categories for spare parts / items
const categorySchema = z.enum(["Tire", "Other", "Motor"], {
  error: () => ({
    message: "Category must be one of: Tire, Other, Motor",
  }),
});

// Schema for POST /add - adding an other spare item.
// The `photo` is an uploaded `multipart/form-data` file (handled by multer in
// req.file) and is therefore intentionally not part of the scalar body schema.
export const addOtherSpareSchema = z.object({
  name: z.string().min(1),
  carModel: z.string().min(1),
  category: categorySchema,
  price: z.coerce.number().int().nonnegative(),
  description: z.string().min(1),
});

// Schema for PATCH /:id - updating an other spare item (all fields optional)
// The photo (if replacing it) is an uploaded file handled by multer in
// req.file, not a body field, so it is not part of this schema.
export const updateOtherSpareSchema = z.object({
  name: z.string().min(1).optional(),
  carModel: z.string().min(1).optional(),
  category: categorySchema.optional(),
  price: z.coerce.number().int().nonnegative().optional(),
  description: z.string().min(1).optional(),
});

// Validates the :id URL param used by update/delete routes
export const idParamSchema = z.object({
  id: z.string().uuid(),
});
