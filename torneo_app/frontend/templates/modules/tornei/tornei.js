document.addEventListener("DOMContentLoaded", function () {
    const searchContainer = document.querySelector(".search-container");
    const searchInput = document.getElementById("searchTorneo");
    const torneiCards = document.querySelectorAll("#torneiList .torneo-card");

    // Valore di filtro corrente (default "tutti")
    let currentFilter = "tutti";

    /**
     * Filtra le card in base al testo di ricerca e allo status corrente
     */
    function filterTornei() {
        const searchText = searchInput.value.toLowerCase();

        torneiCards.forEach(card => {
            const torneoName = card.querySelector("h5").innerText.toLowerCase();
            const dataStatus = card.getAttribute("data-status");

            const matchSearch = torneoName.includes(searchText);
            // Se currentFilter è "tutti", non applichiamo filtri di status
            const matchFilter = (currentFilter === "tutti" || dataStatus === currentFilter);

            // Mostra la card se rispetta entrambi i filtri
            if (matchSearch && matchFilter) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    }

    /**
     * Applica un filtro e aggiorna la UI (box selezionato + lista tornei)
     * @param {string} status - "tutti", "attivi", "conclusi"
     * @param {Event} event - l'evento click per individuare il box cliccato
     */
    window.applyFilter = function(status, event) {
        currentFilter = status;

        // Rimuove la classe 'selected' da tutti i box e la aggiunge al box cliccato
        document.querySelectorAll(".info-box").forEach(box => {
            box.classList.remove("selected");
        });
        // event.currentTarget è il div.col-md-4, il .info-box è il suo primo figlio
        const clickedBox = event.currentTarget.querySelector(".info-box");
        if (clickedBox) {
            clickedBox.classList.add("selected");
        }

        // Filtra le card
        filterTornei();
    }

    // Gestione del focus sulla search-container
    searchContainer.addEventListener("click", function() {
        searchContainer.classList.add("active");
        searchInput.focus();
    });

    document.addEventListener("click", function(event) {
        // Se il click avviene fuori dalla search-container, rimuoviamo la classe active
        if (!searchContainer.contains(event.target)) {
            searchContainer.classList.remove("active");
        }
    });

    // Eventi di input
    searchInput.addEventListener("input", filterTornei);

    // Filtra inizialmente (mostra tutti)
    filterTornei();
});
