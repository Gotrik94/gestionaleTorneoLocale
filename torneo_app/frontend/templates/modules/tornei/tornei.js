document.addEventListener("DOMContentLoaded", function () {
    const searchContainer = document.querySelector(".search-container");
    const searchInput = document.getElementById("searchTorneo");
    const torneiCards = document.querySelectorAll("#torneiList .torneo-card");

    // Filtro corrente (default "tutti")
    let currentFilter = "tutti";

    /**
     * Filtra le card in base al testo di ricerca e al filtro corrente
     */
    function filterTornei() {
        const searchText = searchInput.value.toLowerCase();

        torneiCards.forEach(card => {
            const torneoName = card.querySelector("h5").innerText.toLowerCase();
            const dataStatus = card.getAttribute("data-status");

            const matchSearch = torneoName.includes(searchText);
            const matchFilter = (currentFilter === "tutti" || dataStatus === currentFilter);

            card.style.display = (matchSearch && matchFilter) ? "block" : "none";
        });
    }

    /**
     * Applica un filtro (chiamato cliccando sui box di riepilogo)
     * @param {string} status - "tutti", "attivi", "conclusi"
     * @param {Event} event - evento click per individuare il box cliccato
     */
    window.applyFilter = function(status, event) {
        currentFilter = status;
        // Rimuove la classe "selected" da tutti i box
        document.querySelectorAll(".info-box").forEach(box => {
            box.classList.remove("selected");
        });
        // Aggiunge la classe "selected" al box cliccato
        const clickedBox = event.currentTarget.querySelector(".info-box");
        if (clickedBox) {
            clickedBox.classList.add("selected");
        }
        filterTornei();
    };

    /**
     * Apre la modale "Nuovo Torneo" utilizzando le API di Bootstrap
     */
    window.openCreateTournamentModal = function() {
        const modalEl = document.getElementById('nuovoTorneoModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    /**
     * Crea un nuovo torneo eseguendo una POST all'endpoint API
     */
    window.creaNuovoTorneo = function() {
        const nome = document.getElementById('nomeTorneo').value;
        const inizio = document.getElementById('dataInizio').value;
        const fine = document.getElementById('dataFine').value;
        const fasciaOraria = document.getElementById('fasciaOraria').value;
        const formato = document.getElementById('formato').value;

        // Recupera il token CSRF dal cookie
        const getCSRFToken = () => {
            let cookieValue = null;
            if (document.cookie && document.cookie !== "") {
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.startsWith("csrftoken=")) {
                        cookieValue = cookie.substring("csrftoken=".length, cookie.length);
                        break;
                    }
                }
            }
            return cookieValue;
        };

        fetch('/api/tornei/lista_tornei/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()  // 🔥 Aggiunto token CSRF
            },
            body: JSON.stringify({
                nome: nome,
                data_inizio: inizio,
                data_fine: fine,
                fascia_oraria: fasciaOraria,
                formato: formato,
                is_active: true
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nella creazione del torneo");
            }
            return response.json();
        })
        .then(data => {
            alert('Torneo creato con successo!');
            location.reload();
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore nella creazione del torneo.');
        });
    };


    // Gestione del focus sulla search-container
    searchContainer.addEventListener("click", function() {
        searchContainer.classList.add("active");
        searchInput.focus();
    });
    document.addEventListener("click", function(event) {
        if (!searchContainer.contains(event.target)) {
            searchContainer.classList.remove("active");
        }
    });
    // Evento di input per il filtro in tempo reale
    searchInput.addEventListener("input", filterTornei);

    // Filtra inizialmente (mostra tutte le card)
    filterTornei();
});
