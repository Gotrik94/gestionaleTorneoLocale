document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM Caricato, avvio script...");

    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    const toggleButton = document.querySelector("#sidebarToggle");
    const torneoToggleButtons = document.querySelectorAll(".toggle-btn");

    if (!sidebar) console.error("❌ Sidebar non trovata!");
    if (!mainContent) console.error("❌ Main Content non trovato!");
    if (!toggleButton) console.error("❌ Sidebar Toggle Button non trovato!");
    if (torneoToggleButtons.length === 0) console.warn("⚠️ Nessun toggle torneo trovato!");

    // ✅ Gestione toggle della sidebar
    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            console.log("🔹 Sidebar Toggle Clicked!");
            sidebar.classList.toggle("expanded");
            mainContent.classList.toggle("expanded");

            // Salva lo stato della sidebar in localStorage
            localStorage.setItem("sidebarExpanded", sidebar.classList.contains("expanded"));
        });

        // ✅ Recupera stato precedente della sidebar
        if (localStorage.getItem("sidebarExpanded") === "true") {
            console.log("🔄 Sidebar espansa (recuperata da localStorage)");
            sidebar.classList.add("expanded");
            mainContent.classList.add("expanded");
        }
    }

    // ✅ Gestione pulsanti di espansione dei tornei
    torneoToggleButtons.forEach(button => {
        button.addEventListener("click", function () {
            let targetCollapse = document.querySelector(this.getAttribute("data-bs-target"));
            if (!targetCollapse) {
                console.error(`❌ Il target del pulsante (${this.getAttribute("data-bs-target")}) non esiste!`);
                return;
            }

            let isExpanded = this.textContent.trim() === "+";
            this.textContent = isExpanded ? "-" : "+";
            this.setAttribute("title", isExpanded ? "Riduci" : "Espandi");

            console.log(`🔄 Toggle Torneo: ${this.getAttribute("data-bs-target")} - Stato: ${this.textContent}`);
        });
    });

    // ✅ Inizializza tooltip di Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });

    console.log("✅ Script completato con successo!");
});