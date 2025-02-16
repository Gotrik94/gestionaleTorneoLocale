document.addEventListener("DOMContentLoaded", function() {
    let sidebar = document.getElementById("sidebar");
    let sidebarToggle = document.getElementById("sidebarToggle");

    // ✅ Recupera stato precedente della sidebar da localStorage
    if (localStorage.getItem("sidebarExpanded") === "true") {
        sidebar.classList.add("expanded");
        sidebarToggle.innerHTML = "✖";
    } else {
        sidebar.classList.remove("expanded");
        sidebarToggle.innerHTML = "☰";
    }

    // ✅ Toggle della sidebar e salvataggio dello stato
    sidebarToggle.addEventListener("click", function() {
        sidebar.classList.toggle("expanded");
        let isExpanded = sidebar.classList.contains("expanded");
        localStorage.setItem("sidebarExpanded", isExpanded);
        sidebarToggle.innerHTML = isExpanded ? "✖" : "☰";
    });
});