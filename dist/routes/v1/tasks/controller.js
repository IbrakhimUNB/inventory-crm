export const listTasks = (req, res) => {
    res.status(200).json([]);
};
export const getTask = (req, res) => {
    res.status(200).json({ id: 1, name: "Taks 1" });
};
