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
window.updateTorneo = function (torneoId) {
    console.log("📤 Aggiornamento torneo ID:", torneoId);

    const dataInizio = document.getElementById('dataInizio').value;
    const dataFine = document.getElementById('dataFine').value;

    // 🔁 Associa ID fase solo se esiste, altrimenti lascia fare al backend
    const fasiConGironiAggiornati = (torneoData.fasi || []).map((fase, index) => {
        const faseId = fase.id || index; // fallback per il frontend (non usato nel PUT)
        return {
            ...fase,
            id: fase.id, // solo se già esistente
            gironi: (fase.gironi || []).map(girone => ({
                ...girone,
                ...(fase.id ? { fase: fase.id } : {}) // solo se id esiste
            }))
        };
    });

    // 📦 Crea il payload
    const updatedTorneoData = {
        ...torneoData,
        nome: document.getElementById('nomeTorneo').value,
        data_inizio: dataInizio,
        data_fine: dataFine,
        fascia_oraria: document.getElementById('fasciaOraria').value,
        formato: document.getElementById('formato').value,
        fasi: fasiConGironiAggiornati
    };

    console.log("📤 Payload in uscita:", JSON.stringify(updatedTorneoData, null, 2));

    fetch(`/api/tornei/dettaglio_torneo/${torneoId}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(updatedTorneoData)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => {
                console.error("❌ Errore da backend:", err);
                Swal.fire('Errore!', 'Errore dal server: ' + JSON.stringify(err), 'error');
                throw new Error("Errore PUT");
            });
        }
        return res.json();
    })
    .then(data => {
        console.log("✅ Torneo aggiornato con successo!", data);
        Swal.fire('Modifica riuscita!', 'Il torneo è stato aggiornato.', 'success');
        setTimeout(() => location.reload(), 1500);
    })
    .catch(error => {
        console.error("🔥 Errore durante l'aggiornamento:", error);
        Swal.fire('Errore!', 'C\'è stato un errore nel salvataggio del torneo.', 'error');
    });
};



window.modificaTorneo = function (torneoId) {
    fetch(`/api/tornei/dettaglio_torneo/${torneoId}/`)
        .then(res => res.json())
        .then(data => {
            console.log("Dati torneo da modificare:", data);

            // STEP 1
            document.getElementById('nomeTorneo').value = data.nome;
            document.getElementById('dataInizio').value = data.data_inizio;
            document.getElementById('dataFine').value = data.data_fine;
            document.getElementById('fasciaOraria').value = data.fascia_oraria;
            document.getElementById('formato').value = data.formato;

            // Salva tutto in torneoData
            torneoData = {
                ...data,
                fasi: data.fasi.map(fase => ({
                    ...fase,
                    gironi: fase.gironi || []
                }))
            };

            // STEP 2
            aggiornaListaFasi();

            // STEP 3
            updateSelectFasi();

            // Se ci sono fasi e gironi, carica quelli del primo
            if (torneoData.fasi.length > 0) {
                aggiornaListaGironi(0); // <-- CARICA I GIRONI DELLA PRIMA FASE
            }

            // Mostra primo step
            currentStep = 1;
            showStep(currentStep);

            // Apri modale
            const modal = new bootstrap.Modal(document.getElementById('nuovoTorneoModal'));
            modal.show();

            // Modalità modifica attiva
            window.modalMode = 'edit';
            window.editTorneoId = torneoId;
        });
};
