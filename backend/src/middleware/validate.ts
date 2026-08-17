import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../utils/AppError";

// Validates req.body/query/params against a Zod schema and replaces them
// with the parsed (coerced) values, so controllers get clean typed data.
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = (parsed.query ?? req.query) as typeof req.query;
      req.params = (parsed.params ?? req.params) as typeof req.params;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors
          .map((e) => `${e.path.join(".") || "field"}: ${e.message}`)
          .join("; ");
        return next(new ValidationError(message));
      }
      next(err);
    }
  };
}
