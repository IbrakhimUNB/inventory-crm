export const listProjects = (req, res) => {
    res.status(200).json([]);
};
export const getProject = (req, res) => {
    res.status(200).json({ id: 1, name: "Project 1" });
};
export const listProjectTasks = (req, res) => {
    res.status(200).json({});
};
