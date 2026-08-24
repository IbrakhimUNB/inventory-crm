import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const movieTitles = [
    "The Matrix",
    "Inception",
    "The Dark Knight",
    "Pulp Fiction",
    "Interstellar",
    "The Shawshank Redemption",
    "Fight Club",
    "Forrest Gump",
    "The Godfather",
    "Goodfellas",
];
const main = async () => {
    console.log("Seeding movies...");
    for (const title of movieTitles) {
        await prisma.movie.create({
            data: { title },
        });
        console.log(`Created movie: ${title}`);
    }
    console.log("Seeding completed!");
};
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
