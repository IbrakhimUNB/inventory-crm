import { z } from "zod";

// Common status values allowed for watchlist items
const watchlistStatusSchema = z.enum(
  ["PLANNED", "WATCHING", "COMPLETED", "DROPPED"],
  {
    error: () => ({
      message: "Status must be one of: PLANNED, WATCHING, COMPLETED, DROPPED",
    }),
  },
);

// Schema for POST / - adding a movie to the watchlist
const addToWatchlistSchema = z.object({
  movieId: z.string().uuid(),
  status: watchlistStatusSchema.optional(),
  rating: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Schema for PATCH /:id - updating a watchlist item
const updateWatchlistItemSchema = z.object({
  status: watchlistStatusSchema.optional(),
  rating: z.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Validates the :id URL param used by update/delete routes
const idParamSchema = z.object({
  id: z.string().uuid(),
});

export { addToWatchlistSchema, updateWatchlistItemSchema, idParamSchema };
