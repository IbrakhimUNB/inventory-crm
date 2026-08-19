import express from "express";
import morgan from "morgan";
import cors from "cors";
import config from "./config.js";
import v1 from "./routes/v1/index.js";
const pool = require("./db");
export const createServer = () => {
    const app = express();
    app
        .disable("x-powered-by")
        .use(morgan("dev"))
        .use(express.urlencoded({ extended: true }))
        .use(express.json())
        .use(cors());
    app.get("/health", (req, res) => {
        res.json({ ok: true, enviroment: config.env });
    });
    app.get("/", async (req, res) => {
        try {
            const data = await pool.query("SELECT * FROM schools");
            res.status(200).send(data.rows);
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    });
    app.post("/", async (req, res) => {
        const { name, location } = req.body;
        // Validation
        if (!name || typeof name !== "string" || name.trim() === "") {
            res
                .status(400)
                .send({ message: "name is required and must be a non-empty string" });
            return;
        }
        if (!location || typeof location !== "string" || location.trim() === "") {
            res.status(400).send({
                message: "location is required and must be a non-empty string",
            });
            return;
        }
        if (name.length > 100) {
            res.status(400).send({ message: "name must be at most 100 characters" });
            return;
        }
        if (location.length > 100) {
            res
                .status(400)
                .send({ message: "location must be at most 100 characters" });
            return;
        }
        try {
            await pool.query("INSERT INTO schools (name, address) VALUES ($1, $2)", [
                name.trim(),
                location.trim(),
            ]);
            res.status(200).send({ message: "Successfully added school" });
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    });
    app.get("/setup", async (req, res) => {
        try {
            await pool.query("CREATE TABLE schools(id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100))");
            res.status(200).send({ message: "Successfully created table" });
        }
        catch (err) {
            console.log(err);
            res.sendStatus(500);
        }
    });
    app.use("/v1", v1);
    return app;
};
