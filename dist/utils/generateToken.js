import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET ||
    (() => {
        throw new Error("JWT_SECRET environment variable is not defined");
    })();
const generateToken = (userId, res) => {
    const payload = { id: userId };
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN || "7d"),
    };
    const token = jwt.sign(payload, JWT_SECRET, options);
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return token;
};
export default generateToken;
