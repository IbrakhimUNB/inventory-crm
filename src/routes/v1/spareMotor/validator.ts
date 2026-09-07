import { z } from "zod";

// Allowed categories for spare parts / items
const categorySchema = z.enum(["Tire", "Other", "Motor"], {
  error: () => ({
    message: "Category must be one of: Tire, Other, Motor",
  }),
});

// A base64 photo string, used by the update endpoint.
// Note: the add endpoint takes `photo` as an uploaded image file instead, so it
// is omitted from addSpareMotorSchema (it is parsed/validated by multer).
const photoSchema = z.string().min(1);

// Schema for POST /add - adding a spare motor.
// The `photo` is an uploaded `multipart/form-data` file (handled by multer in
// req.file) and is therefore intentionally not part of the scalar body schema.
export const addSpareMotorSchema = z.object({
  name: z.string().min(1),
  carModel: z.string().min(1),
  category: categorySchema,
  price: z.coerce.number().int().nonnegative(),
  km: z.coerce.number().int().nonnegative(),
  description: z.string().min(1),
});

// Schema for PATCH /:id - updating a spare motor (all fields optional)
export const updateSpareMotorSchema = z
  .object({
    name: z.string().min(1).optional(),
    carModel: z.string().min(1).optional(),
    category: categorySchema.optional(),
    price: z.coerce.number().int().nonnegative().optional(),
    km: z.coerce.number().int().nonnegative().optional(),
    description: z.string().min(1).optional(),
    photo: photoSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required to update",
  });

// Validates the :id URL param used by update/delete routes
export const idParamSchema = z.object({
  id: z.string().uuid(),
});
