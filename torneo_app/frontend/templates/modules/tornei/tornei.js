document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchTorneo");
    const torneiCards = document.querySelectorAll("#torneiList .torneo-card");

    // Filtro corrente (default "tutti")
    let currentFilter = "tutti";

    /**
     * Filtra le card in base al testo di ricerca e al filtro corrente
     */
    function filterTornei() {
        const searchText = searchInput.value.toLowerCase();

        // Recupera tutte le card dei tornei nel DOM
        const torneiCards = document.querySelectorAll(".torneo-card");

        // Nasconde tutte le card dei tornei prima di applicare il filtro
        torneiCards.forEach(card => {
            card.style.display = "none";
        });

        let torneiDaMostrare = [];

        // Seleziona le card in base al filtro attuale
        if (currentFilter === "tutti") {
            torneiDaMostrare = document.querySelectorAll(".torneo-card.totali");
        } else if (currentFilter === "attivi") {
            torneiDaMostrare = document.querySelectorAll(".torneo-card.attivi");
        } else if (currentFilter === "conclusi") {
            torneiDaMostrare = document.querySelectorAll(".torneo-card.conclusi");
        }

        // Filtra i tornei anche per il testo di ricerca
        torneiDaMostrare.forEach(card => {
            const torneoName = card.querySelector("h5").innerText.toLowerCase();
            const matchSearch = torneoName.includes(searchText);

            if (matchSearch) {
                card.style.display = "block";
            }
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
    searchInput.addEventListener("click", function() {
        searchInput.classList.add("active");
        searchInput.focus();
    });

    document.addEventListener("click", function(event) {
        if (!searchInput.contains(event.target)) {
            searchInput.classList.remove("active");
        }
    });
    // Evento di input per il filtro in tempo reale
    searchInput.addEventListener("input", filterTornei);

    // Filtra inizialmente (mostra tutte le card)
    filterTornei();
});

let torneoDaEliminare = null;

function apriModaleEliminazione(torneoId) {
    torneoDaEliminare = torneoId;
    let modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
}

function getCSRFToken() {
    let csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
    if (!csrfToken) {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith('csrftoken=')) {
                csrfToken = cookie.substring('csrftoken='.length, cookie.length);
                break;
            }
        }
    }
    return csrfToken;
}

document.getElementById("confirmDeleteBtn").addEventListener("click", function() {
    if (torneoDaEliminare) {
        fetch(`/api/tornei/elimina/${torneoDaEliminare}/`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            return response.json().catch(() => {
                throw new Error("Risposta non valida dal server.");
            });
        })
        .then(data => {
            // ✅ Chiudiamo la modale PRIMA di mostrare l'alert
            let modalElement = document.getElementById("confirmDeleteModal");
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // ✅ Messaggio di successo con SweetAlert2
            Swal.fire({
                icon: 'success',
                title: 'Torneo eliminato!',
                text: 'Il torneo è stato eliminato correttamente.',
                timer: 2500,
                showConfirmButton: false
            });

            let torneoElement = document.getElementById(`torneo-${torneoDaEliminare}`);
            if (torneoElement) {
                torneoElement.style.transition = "opacity 0.5s ease";
                torneoElement.style.opacity = "0";

                // 🔥 Dopo che il torneo scompare, ricarichiamo la pagina
                setTimeout(() => {
                    torneoElement.remove();
                    location.reload();  // 🔄 Reload della pagina dopo 800ms
                }, 800);
            } else {
                // Se l'elemento non esiste, aggiorna comunque la pagina dopo il messaggio
                setTimeout(() => location.reload(), 1500);
            }
        })
        .catch(error => {
            console.error('❌ Errore:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore!',
                text: `Errore durante l'eliminazione: ${error.message}`
            });
        });
    }
});

