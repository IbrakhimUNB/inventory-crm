import express, { Router } from "express";
import { authMiddleware } from "../../../middleware/authMiddleware.js";
import {
  getMyWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
} from "./controller.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { addToWatchlistSchema } from "./validator.js";
const watchlist: Router = express.Router();

// Every watchlist route requires an authenticated user
watchlist.use(authMiddleware);
watchlist.get("/", getMyWatchlist);
watchlist.post("/", validateRequest(addToWatchlistSchema), addToWatchlist);
watchlist.patch("/:id", updateWatchlistItem);
watchlist.delete("/:id", removeFromWatchlist);

export default watchlist;
