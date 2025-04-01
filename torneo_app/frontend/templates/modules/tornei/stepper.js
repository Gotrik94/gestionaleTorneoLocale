let currentStep = 1;
const totalSteps = 3;
const stepElements = document.querySelectorAll('.step');

// ✅ Dichiara torneoData globale se non esiste
if (typeof window.torneoData === "undefined") {
    window.torneoData = {
        nome: '',
        data_inizio: '',
        data_fine: '',
        fascia_oraria: '',
        formato: '',
        fasi: []
    };
}


// 🔁 Reset quando il modale si chiude
const nuovoTorneoModal = document.getElementById('nuovoTorneoModal');
nuovoTorneoModal.addEventListener('hidden.bs.modal', function () {
    console.log('Modale chiuso. Eseguo reset...');
    if (typeof window.resetTorneoForm === 'function') {
        window.resetTorneoForm();
    } else {
        console.warn('Funzione resetTorneoForm non trovata');
    }
});

// 🔐 CSRF Token
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

// 🔁 Mostra Step
function showStep(step) {
    console.log(`Navigo allo step ${step}`);

    // 🔁 Nasconde tutti gli step
    document.querySelectorAll('.step').forEach(el => {
        el.classList.add('d-none');
        el.classList.remove('active');
    });

    // ✅ Mostra solo lo step attuale
    const currentStepEl = document.querySelector(`.step[data-step='${step}']`);
    if (currentStepEl) {
        currentStepEl.classList.remove('d-none');
        currentStepEl.classList.add('active');
    }

    // 🔁 Cambia comportamento del bottone Indietro
    const btnIndietro = document.getElementById('btnIndietro');
    if (step === 1) {
        btnIndietro.textContent = 'Chiudi';
        btnIndietro.onclick = () => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('nuovoTorneoModal'));
            modal.hide(); // chiude il modale
        };
    } else {
        btnIndietro.textContent = 'Indietro';
        btnIndietro.onclick = prevStep;
    }

    // ✅ STEP 3: aggiorna la select e la lista dei gironi
    if (step === 3) {
        setTimeout(() => {
            updateSelectFasi();

            const faseSelect = document.getElementById("selectFaseGirone");
            const index = parseInt(faseSelect?.value || 0);
            aggiornaListaGironi(index);
        }, 0); // wait for DOM rendering
    }
}



// ➡️ Avanti
function nextStep() {
    if (currentStep === 1) {
        // 🔄 Ripulisco eventuali errori visivi
        const fieldIds = ['nomeTorneo', 'dataInizio', 'dataFine', 'formato'];
        const inputs = fieldIds.map(id => document.getElementById(id));
        inputs.forEach(input => input.classList.remove('input-error'));

        // 🔍 Raccolgo valori
        const [nome, inizio, fine, formato] = inputs;

        let valid = true;

        // ❌ Check se vuoti
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('input-error');
                valid = false;
            }
        });

        // 🛑 Se ci sono campi vuoti → blocca subito
        if (!valid) {
            Swal.fire({
                icon: 'warning',
                title: 'Campi obbligatori',
                text: 'Compila tutti i campi prima di procedere.'
            });
            return;
        }

        // 📆 Check date inizio > fine
        const dataInizio = new Date(inizio.value);
        const dataFine = new Date(fine.value);
        if (dataInizio > dataFine) {
            inizio.classList.add('input-error');
            fine.classList.add('input-error');
            Swal.fire({
                icon: 'error',
                title: 'Date non valide',
                text: 'La data di fine deve essere uguale o successiva alla data di inizio.'
            });
            return;
        }
    }

    // ✅ Step successivo o salvataggio finale
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        updateSelectFasi();
    } else {

        console.log("📤 Payload in uscita:", JSON.stringify(window.torneoData, null, 2));


        // 🔁 Salvataggio: crea o modifica
        if (window.modalMode === 'edit') {
            if (typeof updateTorneo === 'function' || typeof window.updateTorneo === 'function') {
                (window.updateTorneo || updateTorneo)(window.editTorneoId);
            } else {
                console.error("❌ Funzione updateTorneo non definita!");
                Swal.fire('Errore interno', 'Funzione updateTorneo mancante.', 'error');
            }
        } else {
            submitTorneo(); // submit finale
        }
    }
}




// ⬅️ Indietro
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

// ➕ Fase
function aggiungiFase() {
    const nomeFase = prompt("Nome della fase:");
    const dataInizio = prompt("Data inizio (yyyy-mm-dd):");
    const dataFine = prompt("Data fine (yyyy-mm-dd):");

    if (nomeFase && dataInizio && dataFine) {
        torneoData.fasi.push({ nome: nomeFase, data_inizio: dataInizio, data_fine: dataFine, gironi: [] });
        aggiornaListaFasi();
    }
}

function aggiornaListaFasi() {
    const listaFasi = document.getElementById('listaFasi');
    listaFasi.innerHTML = '';

    torneoData.fasi.forEach((fase, i) => {
        listaFasi.innerHTML += `
            <div class="fase-item d-flex justify-content-between align-items-center mb-2 p-2 bg-secondary text-light rounded">
                <div class="flex-grow-1">
                    <input type="text" value="${fase.nome}" class="form-control form-control-sm mb-1"
                           onchange="torneoData.fasi[${i}].nome = this.value">

                    <div class="d-flex gap-2">
                        <input type="date" class="form-control form-control-sm"
                               value="${fase.data_inizio}" onchange="torneoData.fasi[${i}].data_inizio = this.value">
                        <input type="date" class="form-control form-control-sm"
                               value="${fase.data_fine}" onchange="torneoData.fasi[${i}].data_fine = this.value">
                    </div>
                </div>

                <button class="btn btn-sm btn-danger ms-2" onclick="rimuoviFase(${i})">❌</button>
            </div>
        `;
    });
}


function rimuoviFase(index) {
    const faseEliminata = torneoData.fasi.splice(index, 1)[0];
    console.log("🗑️ Fase rimossa:", faseEliminata.nome);
    console.log("🗑️ Gironi associati rimossi:", faseEliminata.gironi || []);
    aggiornaListaFasi();
    updateSelectFasi();
}

function updateSelectFasi() {
    const select = document.getElementById('selectFaseGirone');
    if (!select) return;

    select.innerHTML = torneoData.fasi.map((fase, i) =>
        `<option value="${i}">${fase.nome}</option>`
    ).join('');

    console.log(`🔁 Select gironi aggiornata con ${torneoData.fasi.length} fasi.`);
}



// ➕ Gironi
function aggiungiGirone() {
    const faseIndex = document.getElementById('selectFaseGirone').value;
    const nomeGirone = prompt("Nome del girone:");

    if (nomeGirone) {
        torneoData.fasi[faseIndex].gironi.push({ nome: nomeGirone });
        aggiornaListaGironi(faseIndex);
    }
}

function aggiornaListaGironi(faseIndex) {
    const listaGironi = document.getElementById('listaGironi');
    listaGironi.innerHTML = '';

    const fase = torneoData.fasi[faseIndex];

    console.log("🔄 Aggiorno lista gironi per fase index:", faseIndex);
    if (!fase) {
        console.warn("⚠️ Nessuna fase trovata all'indice:", faseIndex);
        return;
    }

    console.log("📛 Fase selezionata:", fase.nome);
    console.log("📦 Gironi in questa fase:", fase.gironi);

    if (fase.gironi && fase.gironi.length > 0) {
        fase.gironi.forEach((girone, i) => {
            console.log(`➡️ Girone ${i}: ${girone.nome}`);
            listaGironi.innerHTML += `
                <div class="girone-item d-flex justify-content-between align-items-center">
                    <span>${girone.nome}</span>
                    <button class="btn btn-sm btn-danger" onclick="rimuoviGirone(${faseIndex}, ${i})">❌</button>
                </div>`;
        });
    } else {
        console.log("ℹ️ Nessun girone nella fase attuale.");
    }
}



function rimuoviGirone(faseIndex, gironeIndex) {
    torneoData.fasi[faseIndex].gironi.splice(gironeIndex, 1);
    aggiornaListaGironi(faseIndex);
}

// 📤 Submit Torneo
window.submitTorneo = function () {

    const nome = document.getElementById('nomeTorneo').value;
    const dataInizio = document.getElementById('dataInizio').value;
    const dataFine = document.getElementById('dataFine').value;

    if (!dataInizio || !dataFine) {
        Swal.fire('Attenzione', 'Inserisci sia la data di inizio che di fine.', 'warning');
        return;
    }

    const fascia = document.getElementById('fasciaOraria').value;
    const formato = document.getElementById('formato').value;

    // 🔁 Inietto l'ID della fase in ogni girone
    const fasiConFaseId = (window.torneoData?.fasi || []).map(fase => ({
        ...fase,
        gironi: (fase.gironi || []).map(girone => ({
            ...girone,
            fase: fase.id
        }))
    }));

    const data = {
        nome,
        data_inizio: dataInizio,
        data_fine: dataFine,
        fascia_oraria: fascia,
        formato,
        fasi: fasiConFaseId
    };

    console.log("📦 Payload creato:", data);

    fetch('/api/tornei/lista_tornei/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => {
                console.error("❌ Errore da backend:", err);
                Swal.fire('Errore!', 'Errore dal server: ' + JSON.stringify(err), 'error');
                throw new Error("Errore POST");
            });
        }
        return res.json();
    })
    .then(data => {
        console.log("✅ Torneo creato!", data);
        Swal.fire('Successo!', 'Torneo creato correttamente.', 'success');
        setTimeout(() => location.reload(), 1500);
    })
    .catch(err => {
        console.error('🔥 Errore nella creazione:', err);
        Swal.fire('Errore!', 'Errore durante la creazione.', 'error');
    });
};


// 🧼 Reset Completo
// 🧼 Reset Completo
window.resetTorneoForm = function () {
    console.log('RESET del form torneo in corso...');

    window.modalMode = 'create';
    window.editTorneoId = null;

    // 🔁 Rimuovi visivamente errori
    const allInputs = ['nomeTorneo', 'dataInizio', 'dataFine', 'formato'];
    allInputs.forEach(id => document.getElementById(id).classList.remove('input-error'));

    // ⏹ Reset valori
    document.getElementById('nomeTorneo').value = '';
    document.getElementById('dataInizio').value = '';
    document.getElementById('dataFine').value = '';
    document.getElementById('fasciaOraria').value = '';
    document.getElementById('formato').value = 'DRAFT';
    document.getElementById('inputNomeFase').value = '';
    document.getElementById('inputDataInizioFase').value = '';
    document.getElementById('inputDataFineFase').value = '';
    document.getElementById('inputNomeGirone').value = '';
    document.getElementById('listaFasi').innerHTML = '';
    document.getElementById('listaGironi').innerHTML = '';

    // ⏹ Reset dati JS e step
    torneoData = { fasi: [] };
    currentStep = 1;
    showStep(currentStep);

    console.log('Form resettato completamente:', torneoData);
};


// ➕ Fase da form
function aggiungiFaseDaForm() {
    const nome = document.getElementById('inputNomeFase').value;
    const dataInizio = document.getElementById('inputDataInizioFase').value;
    const dataFine = document.getElementById('inputDataFineFase').value;

    if (!nome || !dataInizio || !dataFine) {
        Swal.fire('Attenzione', 'Compila tutti i campi della fase', 'warning');
        return;
    }

    torneoData.fasi.push({ nome, data_inizio: dataInizio, data_fine: dataFine, gironi: [] });
    aggiornaListaFasi();
    document.getElementById('inputNomeFase').value = '';
    document.getElementById('inputDataInizioFase').value = '';
    document.getElementById('inputDataFineFase').value = '';
}

// ➕ Girone da form
function aggiungiGironeDaForm() {
    const nome = document.getElementById('inputNomeGirone').value;
    const faseIndex = parseInt(document.getElementById('selectFaseGirone').value);

    if (!nome || isNaN(faseIndex)) {
        Swal.fire('Attenzione', 'Seleziona una fase e inserisci il nome del girone.', 'warning');
        return;
    }

    torneoData.fasi[faseIndex].gironi.push({ nome });
    aggiornaListaGironi(faseIndex);
    document.getElementById('inputNomeGirone').value = '';
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM caricato. Mostro primo step...');
    showStep(currentStep);

    const nuovoTorneoModal = document.getElementById('nuovoTorneoModal');
    nuovoTorneoModal.addEventListener('hidden.bs.modal', function () {
        console.log('➡️ Modale CHIUSO - resetTorneoForm chiamato');
        if (typeof window.resetTorneoForm === 'function') {
            console.log("✅ resetTorneoForm eseguito");
        } else {
            console.warn('❌ resetTorneoForm NON trovata');
        }
    });
});