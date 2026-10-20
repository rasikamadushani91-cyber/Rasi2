document.addEventListener("DOMContentLoaded", function () {
    const projectForm = document.getElementById("projectForm");
    const year = document.getElementById("year");

    year.textContent = new Date().getFullYear();

    projectForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const project = {
            id: "",
            name: document.getElementById("projectName").value.trim(),
            district: document.getElementById("district").value,
            division: document.getElementById("division").value.trim(),
            gsDivision: document.getElementById("gsDivision").value.trim(),
            sector: document.getElementById("sector").value,
            responsiblePerson: document.getElementById("responsiblePerson").value.trim(),
            budget: Number(document.getElementById("budget").value),
            status: document.getElementById("status").value,
            description: document.getElementById("description").value.trim(),
            dateAdded: new Date().toISOString()
        };

        if (!project.name || !project.district || !project.division ||
            !project.gsDivision || !project.sector ||
            !project.responsiblePerson ||
            document.getElementById("budget").value === "" ||
            !Number.isFinite(project.budget) || project.budget < 0) {
            alert("Please complete all required fields correctly.");
            return;
        }

        try {
            const savedProjects = JSON.parse(
                localStorage.getItem("rdbProjects") || "[]"
            );

            if (!Array.isArray(savedProjects)) {
                throw new Error("Invalid saved project data");
            }

            const highestId = savedProjects.reduce(function (highest, item) {
                const match = String(item.id || "").match(/^RDB(\d+)$/);
                return match ? Math.max(highest, Number(match[1])) : highest;
            }, 4);

            project.id = "RDB" + String(highestId + 1).padStart(3, "0");

            savedProjects.push(project);

            localStorage.setItem(
                "rdbProjects",
                JSON.stringify(savedProjects)
            );

            alert("Project proposal submitted successfully!");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Unable to save project:", error);
            alert("The project could not be saved. Please check browser storage.");
        }
    });
});
