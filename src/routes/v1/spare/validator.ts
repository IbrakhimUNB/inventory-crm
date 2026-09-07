import { z } from "zod";

// Allowed categories for spare parts / items
const categorySchema = z.enum(["Tire", "Other", "Motor"], {
  error: () => ({
    message: "Category must be one of: Tire, Other, Motor",
  }),
});

const nameSchema = z.string().min(1);
const priceSchema = z.coerce.number().int().nonnegative();
const descriptionSchema = z.string().min(1);

// Each spare item type carries its own set of scalar fields.
// The `photo` is an uploaded multipart file handled by multer in req.file,
// so it is intentionally not part of these scalar schemas.
const motorSchema = z.object({
  type: z.literal("motor"),
  name: nameSchema,
  carModel: z.string().min(1),
  category: categorySchema,
  price: priceSchema,
  km: z.coerce.number().int().nonnegative(),
  description: descriptionSchema,
});

const tireSchema = z.object({
  type: z.literal("tire"),
  name: nameSchema,
  size: z.coerce.number().int().nonnegative(),
  category: categorySchema,
  price: priceSchema,
  description: descriptionSchema,
  quantity: z.coerce.number().int().nonnegative(),
});

const otherSchema = z.object({
  type: z.literal("other"),
  name: nameSchema,
  carModel: z.string().min(1),
  category: categorySchema,
  price: priceSchema,
  description: descriptionSchema,
});

// The type discriminator picks the correct item shape for an add request.
export const addSpareSchema = z.discriminatedUnion("type", [
  motorSchema,
  tireSchema,
  otherSchema,
]);

// Validates the `:type` and `:id` used by the delete route.
export const deleteSpareParamsSchema = z.object({
  type: z.enum(["motor", "tire", "other"]),
  id: z.string().uuid(),
});
