import bcrypt from "bcryptjs";
import { prisma } from "../../../prisma.js";
import generateToken from "../../../utils/generateToken.js";
// POST /v1/auth/register
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ message: "name, email and password are required" });
        return;
    }
    try {
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            res.status(409).json({ message: "User already exists" });
            return;
        }
        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create User
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        // Generate JWT token
        const token = generateToken(user.id, res);
        res.status(201).json({
            status: "success",
            data: {
                user: {
                    id: user.id,
                    name: name,
                    email: email,
                },
                token,
            },
        });
    }
    catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    // Check whether user exists
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }
    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }
    // Generate JWT token
    const token = generateToken(user.id, res);
    res.status(201).json({
        status: "success",
        data: {
            user: {
                id: user.id,
                email: email,
            },
            token,
        },
    });
};
export const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
};
