import { authMiddleware } from "../../../middleware/authMiddleware.js";
import { listMovies, getMovie } from "./controller.js";
import express, { Router } from "express";

const movies: Router = express.Router();

movies.use(authMiddleware);

movies.get("/", listMovies);
movies.get("/:id", getMovie);

export default movies;
