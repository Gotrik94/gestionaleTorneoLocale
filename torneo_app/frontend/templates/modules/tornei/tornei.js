document.addEventListener("DOMContentLoaded", function () {

    // 🔹 Ottieni CSRF Token
    function getCSRFToken() {
        let csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
        if (!csrfToken) {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                if (cookie.trim().startsWith('csrftoken=')) {
                    csrfToken = cookie.trim().substring('csrftoken='.length);
                }
            });
        }
        return csrfToken;
    }

    // 🔹 Gestione apertura modale creazione torneo
    window.openCreateTournamentModal = function () {
        const modalEl = document.getElementById('nuovoTorneoModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    // 🔹 Creazione Torneo
    window.creaNuovoTorneo = function () {

        console.log("Crea nuovo torneo chiamato!");

        const nome = document.getElementById('nomeTorneo').value;
        const inizio = document.getElementById('dataInizio').value;
        const fine = document.getElementById('dataFine').value;
        const fasciaOraria = document.getElementById('fasciaOraria').value;
        const formato = document.getElementById('formato').value;

        console.log("Dati torneo inviati:", { nome, inizio, fine, fasciaOraria, formato });

        if (!nome || !inizio || !fine || !fasciaOraria || !formato) {
            Swal.fire({
                icon: "error",
                title: "Errore!",
                text: "Tutti i campi sono obbligatori."
            });
            return;
        }

        fetch('/api/tornei/lista_tornei/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                nome,
                data_inizio: inizio,
                data_fine: fine,
                fascia_oraria: fasciaOraria,
                formato,
                is_active: true
            })
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Errore HTTP: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Risposta dal backend:", data);
            Swal.fire({
                icon: "success",
                title: "Torneo Creato!",
                text: "Il torneo è stato creato con successo.",
                timer: 2000,
                showConfirmButton: false
            });
            setTimeout(() => location.reload(), 1500);
        })
        .catch(error => {
            console.error('Errore:', error);
            Swal.fire({
                icon: "error",
                title: "Errore!",
                text: "Errore nella creazione del torneo: " + error.message
            });
        });
    };

    // 🔹 Eliminazione Torneo
    window.apriModaleEliminazione = function (torneoId, torneoNome) {
        Swal.fire({
            title: `Vuoi eliminare il torneo "${torneoNome}"?`,
            text: "Questa azione non è reversibile!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sì, elimina!",
            cancelButtonText: "Annulla"
        }).then(result => {
            if (result.isConfirmed) {
                fetch(`/api/tornei/elimina/${torneoId}/`, {
                    method: "DELETE",
                    headers: { "X-CSRFToken": getCSRFToken() }
                })
                .then(response => {
                    if (!response.ok) throw new Error("Errore HTTP");
                    return response.json();
                })
                .then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Torneo eliminato!',
                        text: 'Il torneo è stato eliminato correttamente.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setTimeout(() => location.reload(), 1500);
                })
                .catch(error => {
                    console.error('Errore:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore!',
                        text: 'Errore durante l\'eliminazione del torneo.'
                    });
                });
            }
        });
    };

    // 🔹 Ricerca tornei
    let currentFilter = "tutti"; // definizione variabile globale

    const searchInput = document.getElementById("searchTorneo");

    // 🔹 Funzione di filtraggio tornei
    function filterTornei() {
        const searchText = searchInput.value.toLowerCase().trim();
        const torneiCards = document.querySelectorAll(".torneo-card");

        torneiCards.forEach(card => {
            const nome = card.querySelector("td.text-warning").innerText.toLowerCase();
            const matchSearch = nome.includes(searchText);

            const isInCorso = card.classList.contains("in_corso");
            const isConcluso = card.classList.contains("concluso");
            const isProgrammato = card.classList.contains("programmato");

            let matchFilter = false;
            if (currentFilter === "tutti") matchFilter = true;
            else if (currentFilter === "attivi") matchFilter = isInCorso;
            else if (currentFilter === "conclusi") matchFilter = isConcluso;
            else if (currentFilter === "programmati") matchFilter = isProgrammato;

            card.style.display = (matchSearch && matchFilter) ? "" : "none";
        });

        console.log("Filtro applicato:", currentFilter);
    }

    // 🔹 Applicazione filtro tramite pulsanti
    window.applyFilter = function(status, event) {
        currentFilter = status;

        document.querySelectorAll(".btn-outline-warning, .btn-outline-success, .btn-outline-danger").forEach(btn => {
            btn.classList.remove("selected");
        });
        event.currentTarget.classList.add("selected");

        filterTornei();
    };

    // Ricerca in tempo reale
    searchInput.addEventListener("input", filterTornei);

    // Inizializza filtro al caricamento della pagina
    filterTornei();


});
