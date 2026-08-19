import { listMovies, getMovie } from "./controller.js";
import express from "express";
const movies = express.Router();
movies.get("/", listMovies);
movies.get("/:id", getMovie);
export default movies;
