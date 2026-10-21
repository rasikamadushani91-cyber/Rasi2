
"use strict";

const STORAGE_KEY = "rdbPifsProjects";

const columns = [
    ["projectId", "Project ID"],
    ["projectName", "Project Name"],
    ["district", "District"],
    ["division", "DS Division"],
    ["gsDivision", "GN Division"],
    ["sector", "Sector"],
    ["responsiblePerson", "Responsible Person"],
    ["projectDate", "Project Date"],
    ["projectStatus", "Status"],
    ["description", "Description"],
    ["receivedDS", "Received DS Count"],
    ["receivedGN", "Received GN Count"],
    ["approvedGN", "Approved GN Count"],
    ["rejectedGN", "Rejected GN Count"],
    ["conceptProjects", "All Concept Projects"],
    ["estimatedCost", "Estimated Cost (LKR)"],
    ["approvedDS", "Approved DS Count"],
    ["approvedGS", "Approved GN Count"],
    ["approvedProjects", "Approved Projects Count"],
    ["beneficiaries", "Direct Beneficiaries"],
    ["projectValue", "Project Value (LKR)"],
    ["approvedCost", "Approved Cost (LKR)"],
    ["uncoveredDivisions", "Divisions Not Covered"],
    ["approvedProjectValue", "Approved Project Value (LKR)"],
    ["approvedAllocation", "Approved Allocation (LKR)"],
    ["cdcsEstablished", "CDCs Established"],
    ["tractorProjects", "Tractor Projects"],
    ["tractorDetails", "Tractor Details"],
    ["tractorQuantity", "Tractor Quantity"],
    ["tractorCost", "Tractor Cost (LKR)"]
];

const tableBody = document.getElementById("projectsTableBody");
const searchInput = document.getElementById("searchInput");
const districtFilter = document.getElementById("districtFilter");
const statusFilter = document.getElementById("statusFilter");
const recordCount = document.getElementById("recordCount");
const emptyState = document.getElementById("emptyState");

function getProjects() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const projects = savedData ? JSON.parse(savedData) : [];
        return Array.isArray(projects) ? projects : [];
    } catch (error) {
        console.error("Could not read saved projects:", error);
        return [];
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function getStatusClass(status) {
    const normalized = String(status ?? "")
        .trim()
        .toLowerCase();

    const allowedStatuses = [
        "pending",
        "accepted",
        "rejected",
        "returned",
        "completed",
        "ongoing"
    ];

    return allowedStatuses.includes(normalized)
        ? `status-${normalized}`
        : "";
}

function formatValue(key, value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    if (key === "projectStatus") {
        const status = escapeHTML(value);
        const statusClass = getStatusClass(value);

        return `<span class="status-badge ${statusClass}">${status}</span>`;
    }

    return escapeHTML(value);
}

function updateSummary(projects) {
    document.getElementById("totalProjects").textContent =
        projects.length;

    const countStatus = status =>
        projects.filter(project =>
            String(project.projectStatus ?? "")
                .trim()
                .toLowerCase() === status
        ).length;

    document.getElementById("pendingProjects").textContent =
        countStatus("pending");

    document.getElementById("acceptedProjects").textContent =
        countStatus("accepted");

    document.getElementById("rejectedProjects").textContent =
        countStatus("rejected");
}

function updateDistrictOptions(projects) {
    const selectedDistrict = districtFilter.value;

    const districts = [
        ...new Set(
            projects
                .map(project => String(project.district ?? "").trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    districtFilter.innerHTML =
        '<option value="">All Districts</option>';

    districts.forEach(district => {
        const option = document.createElement("option");
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });

    if (districts.includes(selectedDistrict)) {
        districtFilter.value = selectedDistrict;
    }
}

function getFilteredProjects() {
    const projects = getProjects();

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedDistrict = districtFilter.value;
    const selectedStatus = statusFilter.value.toLowerCase();

    return projects.filter(project => {
        const matchesSearch = columns.some(([key]) =>
            String(project[key] ?? "")
                .toLowerCase()
                .includes(searchTerm)
        );

        const matchesDistrict =
            !selectedDistrict ||
            String(project.district ?? "") === selectedDistrict;

        const matchesStatus =
            !selectedStatus ||
            String(project.projectStatus ?? "")
                .trim()
                .toLowerCase() === selectedStatus;

        return matchesSearch && matchesDistrict && matchesStatus;
    });
}

function renderTable() {
    const projects = getFilteredProjects();

    recordCount.textContent =
        `Showing ${projects.length} of ${getProjects().length} projects`;

    emptyState.hidden = projects.length !== 0;
    tableBody.innerHTML = "";

    if (projects.length === 0) {
        return;
    }

    const fragment = document.createDocumentFragment();

    projects.forEach(project => {
        const row = document.createElement("tr");

        columns.forEach(([key]) => {
            const cell = document.createElement("td");
            cell.innerHTML = formatValue(key, project[key]);
            row.appendChild(cell);
        });

        fragment.appendChild(row);
    });

    tableBody.appendChild(fragment);
}

function refreshDashboard() {
    const projects = getProjects();

    updateSummary(projects);
    updateDistrictOptions(projects);
    renderTable();
}

function clearAllFilters() {
    searchInput.value = "";
    districtFilter.value = "";
    statusFilter.value = "";
    renderTable();
}

function exportCSV() {
    const projects = getFilteredProjects();

    if (projects.length === 0) {
        alert("There are no project records to export.");
        return;
    }

    function csvEscape(value) {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection.
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    const header = columns.map(([, label]) => csvEscape(label));

    const rows = projects.map(project =>
        columns.map(([key]) => csvEscape(project[key]))
    );

    const csvContent = "\uFEFF" +
        [header, ...rows]
            .map(row => row.join(","))
            .join("\r\n");

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "RDB-PIFS-Project-Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

searchInput.addEventListener("input", renderTable);
districtFilter.addEventListener("change", renderTable);
statusFilter.addEventListener("change", renderTable);

document.getElementById("clearFilters")
    .addEventListener("click", clearAllFilters);

document.getElementById("refreshBtn")
    .addEventListener("click", refreshDashboard);

document.getElementById("exportBtn")
    .addEventListener("click", exportCSV);

// Update the dashboard when returning from another page
// or when another browser tab changes the saved records.
window.addEventListener("pageshow", refreshDashboard);

window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) {
        refreshDashboard();
    }
});

// Initial load
refreshDashboard();
