import { Request, Response } from "express";
import { WatchlistStatus } from "../../../generated/prisma/enums.js";
import { prisma } from "../../../prisma.js";

const getMyWatchlist = async (req: Request, res: Response) => {
  const watchlistItems = await prisma.watchlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      movie: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({
    status: "success",
    data: {
      watchlistItems,
    },
  });
};

const addToWatchlist = async (req: Request, res: Response) => {
  const { movieId, status, rating, notes } = req.body;

  // Verify movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }

  // Check if already added
  const existingInWatchlist = await prisma.watchlistItem.findUnique({
    where: {
      userId_movieId: {
        userId: req.user.id,
        movieId: movieId,
      },
    },
  });

  if (existingInWatchlist) {
    res.status(400).json({ error: "Movie already in the watchlist" });
    return;
  }

  const watchlistItem = await prisma.watchlistItem.create({
    data: {
      userId: req.user.id,
      movieId,
      status: status || "PLANNED",
      rating,
      notes,
    },
  });

  res.status(201).json({
    status: "Success",
    data: {
      watchlistItem,
    },
  });
};

/**
 * Update watchlist item
 * Updates status, rating, or notes
 * Ensures only owner can update
 * Requires protect middleware
 */
const updateWatchlistItem = async (req: Request, res: Response) => {
  const { status, rating, notes } = req.body;

  // Find watchlist item and verify ownership
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id: req.params.id },
  });

  if (!watchlistItem) {
    res.status(404).json({ error: "Watchlist item not found" });
    return;
  }

  // Ensure only owner can update
  if (watchlistItem.userId !== req.user.id) {
    res
      .status(403)
      .json({ error: "Not allowed to update this watchlist item" });
    return;
  }

  // Build update data
  const updateData: {
    status?: WatchlistStatus;
    rating?: number;
    notes?: string;
  } = {};

  if (status !== undefined) {
    updateData.status = String(status).toUpperCase() as WatchlistStatus;
  }
  if (rating !== undefined) updateData.rating = rating;
  if (notes !== undefined) updateData.notes = notes;
  // Update watchlist item
  const updatedItem = await prisma.watchlistItem.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: {
      watchlistItem: updatedItem,
    },
  });
};

/**
 * Remove movie from watchlist
 * Deletes watchlist item
 * Ensures only owner can delete
 * Requires protect middleware
 */
const removeFromWatchlist = async (req: Request, res: Response) => {
  // Find watchlist item and verify ownership
  const watchlistItem = await prisma.watchlistItem.findUnique({
    where: { id: req.params.id },
  });

  if (!watchlistItem) {
    res.status(404).json({ error: "Watchlist item not found" });
    return;
  }

  // Ensure only owner can delete
  if (watchlistItem.userId !== req.user.id) {
    res
      .status(403)
      .json({ error: "Not allowed to delete this watchlist item" });
    return;
  }

  await prisma.watchlistItem.delete({
    where: { id: req.params.id },
  });

  res.status(200).json({
    status: "success",
    message: "Movie removed from watchlist",
  });
};
export {
  getMyWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
};
