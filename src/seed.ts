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

  // Need a user to set as Movie creator
  const creator = await prisma.user.upsert({
    where: { email: "seeder@example.com" },
    update: {},
    create: {
      name: "Seeder",
      email: "seeder@example.com",
      password: "not-a-real-password",
    },
  });

  for (const title of movieTitles) {
    await prisma.movie.create({
      data: {
        title,
        releaseYear: 2000,
        creator: { connect: { id: creator.id } },
      },
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
