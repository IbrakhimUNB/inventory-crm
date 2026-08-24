import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

type ValidationSource = "body" | "params";
export const validateRequest = (
  schema: ZodTypeAny,
  source: ValidationSource = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === "params" ? req.params : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      const formatted = result.error.format();
      const flatErrors = Object.values(formatted)
        .flat()
        .filter(Boolean)
        .map((err) => err._errors)
        .flat();
      res.status(400).json({ message: flatErrors.join(", ") });
      return;
    }

    next();
  };
};
