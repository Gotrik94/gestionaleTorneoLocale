document.addEventListener("DOMContentLoaded", function () {
    console.log("Script caricamento completato.");

    // 🔹 Funzione per ottenere il CSRF Token
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

    // 🔹 Filtra le squadre nella ricerca
    function filtraSquadre() {
        const searchInput = document.getElementById("searchSquadra");
        const squadreCols = document.querySelectorAll("#squadreContainer .col-md-4");
        const searchText = searchInput.value.toLowerCase().trim();

        squadreCols.forEach(col => {
            const card = col.querySelector(".squadra-card");
            const cardTitle = card.querySelector(".card-title");

            if (card.classList.contains("create-squadra")) {
                col.style.display = "flex";
                return;
            }

            if (!cardTitle) {
                col.style.display = "none";
                return;
            }

            const squadraName = cardTitle.innerText.toLowerCase();
            col.style.display = squadraName.includes(searchText) ? "flex" : "none";
        });
    }

    // 🔹 Visualizza dettagli della squadra
    function visualizzaDettagli(squadraId) {
        console.log("Visualizza dettagli della squadra con ID:", squadraId);
    }

    // 🔹 Elimina squadra
    function eliminaSquadra(squadraId) {
        Swal.fire({
            title: "Sei sicuro?",
            text: "Questa azione disattiverà la squadra!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sì, elimina!",
            cancelButtonText: "Annulla"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/squadre/elimina_squadra/${squadraId}/`, {
                    method: "DELETE",
                    headers: { "X-CSRFToken": getCSRFToken() }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Errore durante l'eliminazione");
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.message) {
                        Swal.fire({ title: "Eliminata!", text: "La squadra è stata disattivata.", icon: "success", showConfirmButton: false, timer: 2500 });
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Swal.fire("Errore!", "Risposta API inattesa.", "error");
                    }
                })
                .catch(error => {
                    console.error("Errore durante l'eliminazione:", error);
                    Swal.fire("Errore!", "Qualcosa è andato storto: " + error.message, "error");
                });
            }
        });
    }

    // 🔹 Apre la modale per la modifica
    function apriModificaSquadra(squadraId) {
        console.log("Apertura modale per modifica squadra con ID:", squadraId);

        // Imposta l'ID della squadra in un attributo nascosto
        document.getElementById("salvaModificaSquadra").setAttribute("data-squadra-id", squadraId);

        // Mostra la modale di modifica
        let modal = new bootstrap.Modal(document.getElementById("modificaSquadraModal"));
        modal.show();
    }

        // 🔹 Modifica squadra
    function modificaSquadra() {
        const squadraId = document.getElementById("salvaModificaSquadra").getAttribute("data-squadra-id");
        const nuovoNome = document.getElementById("nuovoNomeSquadra").value;
        const nuovoLogoInput = document.getElementById("nuovoLogoSquadra");
        const nuovoLogo = nuovoLogoInput.files.length > 0 ? nuovoLogoInput.files[0] : null;

        console.log("Dati inviati:", { squadraId, nuovoNome, nuovoLogo });

        const formData = new FormData();
        if(nuovoNome){
        formData.append("nome", nuovoNome);
        }
        if (nuovoLogo) {
            formData.append("logo", nuovoLogo);
        }

        fetch(`/api/squadre/modifica_squadra/${squadraId}/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken() },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nella modifica della squadra");
            }
            return response.json();
        })
        .then(data => {
            console.log("Risposta dal backend:", data);
            Swal.fire({ icon: "success", title: "Squadra Modificata!", text: "La squadra è stata aggiornata con successo.", timer: 2500, showConfirmButton: false });
            setTimeout(() => location.reload(), 1500);
        })
        .catch(error => {
            console.error("Errore:", error);
            Swal.fire({ icon: "error", title: "Errore!", text: "Errore nella modifica della squadra." });
        });
    }

    // 🔹 Inizializzazione degli eventi
    const searchInput = document.getElementById("searchSquadra");
    if (searchInput) {
        searchInput.addEventListener("input", filtraSquadre);
    }

    document.querySelectorAll(".btn-elimina-squadra").forEach(button => {
        button.addEventListener("click", function () {
            eliminaSquadra(this.dataset.squadraId);
        });
    });

    document.querySelectorAll(".btn-modifica-squadra").forEach(button => {
        button.addEventListener("click", function () {
            apriModificaSquadra(this.dataset.squadraId);
        });
    });

    document.querySelectorAll(".btn-dettagli-squadra").forEach(button => {
        button.addEventListener("click", function () {
            visualizzaDettagli(this.dataset.squadraId);
        });
    });

    const salvaModificaButton = document.getElementById("salvaModificaSquadra");
    if (salvaModificaButton) {
        salvaModificaButton.addEventListener("click", modificaSquadra);
    }

    document.getElementById("nuovoLogoSquadra").addEventListener("change", function () {
      const nomeFile = this.files.length > 0 ? this.files[0].name : "Nessun file selezionato";
      document.getElementById("nomeFileSelezionato").textContent = nomeFile;
    });

});