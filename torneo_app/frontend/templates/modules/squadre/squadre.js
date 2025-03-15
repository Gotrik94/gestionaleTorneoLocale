document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchSquadra");
    const squadreCols = document.querySelectorAll("#squadreContainer .col-md-4");

    function filtraSquadre() {
        const searchText = searchInput.value.toLowerCase().trim();

        squadreCols.forEach(col => {
            const card = col.querySelector(".squadra-card");
            const cardTitle = card.querySelector(".card-title");

            // Escludi la card "Crea Nuova Squadra" dal filtro
            if (card.classList.contains("create-squadra")) {
                col.style.display = "flex";
                return;
            }

            // Se manca il titolo della squadra, nascondi la colonna
            if (!cardTitle) {
                col.style.display = "none";
                return;
            }

            const squadraName = cardTitle.innerText.toLowerCase();
            let matchSearch = squadraName.includes(searchText);

            // Usa flex invece di block per evitare bug di spazi vuoti
            col.style.display = matchSearch ? "flex" : "none";
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filtraSquadre);
    }

    filtraSquadre();
});

document.addEventListener("DOMContentLoaded", function () {
    /**
     * Apre la modale per la creazione di una nuova squadra.
     */
    window.openCreateSquadraModal = function () {
        const modalEl = document.getElementById('nuovaSquadraModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    };

    /**
     * Crea una nuova squadra inviando i dati al server tramite fetch.
     */
    window.creaNuovaSquadra = function () {
        const nome = document.getElementById('nomeSquadra').value;
        const logo = document.getElementById('logoSquadra').files[0]; // Recupera il file selezionato
        const dataIscrizione = document.getElementById('dataIscrizione').value;

        if (!nome || !logo || !dataIscrizione) {
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Compila tutti i campi obbligatori!'
            });
            return;
        }

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('logo', logo);
        formData.append('data_iscrizione', dataIscrizione);

        fetch('/api/squadre/crea_squadra/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nella creazione della squadra");
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Squadra Creata!',
                text: 'La squadra è stata aggiunta con successo.',
                timer: 2500,
                showConfirmButton: false
            });

            // Chiudere la modale dopo la creazione
            let modalElement = document.getElementById("nuovaSquadraModal");
            let modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();

            // Ricaricare la pagina per mostrare la nuova squadra
            setTimeout(() => location.reload(), 1500);
        })
        .catch(error => {
            console.error('Errore:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore!',
                text: 'Errore nella creazione della squadra.'
            });
        });
    };
});

/**
 * Recupera il token CSRF dal cookie per le richieste POST.
 */
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

