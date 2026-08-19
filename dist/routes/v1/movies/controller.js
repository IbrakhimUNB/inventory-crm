import { prisma } from "../../../prisma.js";
export const listMovies = async (_req, res) => {
    try {
        const movies = await prisma.movie.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(movies);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};
export const getMovie = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const movie = await prisma.movie.findUnique({ where: { id } });
        if (!movie) {
            res.status(404).json({ message: "Movie not found" });
            return;
        }
        res.status(200).json(movie);
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};
