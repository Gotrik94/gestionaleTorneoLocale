let currentStep = 1;
const totalSteps = 3;
const stepElements = document.querySelectorAll('.step');
let torneoData = { fasi: [] };

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
    document.querySelectorAll('.step').forEach(el => {
        el.classList.add('d-none');
        el.classList.remove('active');
    });

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

    // ✅ Passo allo step successivo
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        updateSelectFasi();
    } else {
        submitTorneo(); // submit finale
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
        listaFasi.innerHTML += `<div class="fase-item">${fase.nome} (${fase.data_inizio} - ${fase.data_fine})
        <button class="btn btn-sm btn-danger" onclick="rimuoviFase(${i})">❌</button></div>`;
    });
}

function rimuoviFase(index) {
    torneoData.fasi.splice(index, 1);
    aggiornaListaFasi();
    updateSelectFasi();
}

function updateSelectFasi() {
    const select = document.getElementById('selectFaseGirone');
    select.innerHTML = torneoData.fasi.map((fase, i) => `<option value="${i}">${fase.nome}</option>`).join('');
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
    torneoData.fasi[faseIndex].gironi.forEach((girone, i) => {
        listaGironi.innerHTML += `<div class="girone-item">${girone.nome}
        <button class="btn btn-sm btn-danger" onclick="rimuoviGirone(${faseIndex},${i})">❌</button></div>`;
    });
}

function rimuoviGirone(faseIndex, gironeIndex) {
    torneoData.fasi[faseIndex].gironi.splice(gironeIndex, 1);
    aggiornaListaGironi(faseIndex);
}

// 📤 Submit Torneo
function submitTorneo() {
    try {
        torneoData.nome = document.getElementById('nomeTorneo').value;
        torneoData.data_inizio = document.getElementById('dataInizio').value;
        torneoData.data_fine = document.getElementById('dataFine').value;
        torneoData.fascia_oraria = document.getElementById('fasciaOraria').value;
        torneoData.formato = document.getElementById('formato').value;

        fetch('/api/tornei/lista_tornei/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(torneoData)
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errData => {
                    throw new Error(errData.message || 'Errore durante la richiesta');
                });
            }
            return res.json();
        })
        .then(data => {
            Swal.fire('Successo!', 'Torneo creato correttamente.', 'success');
            setTimeout(() => location.reload(), 1500);
        })
        .catch(err => {
            Swal.fire('Errore', err.message, 'error');
        });

    } catch (error) {
        Swal.fire('Errore', 'Errore durante la preparazione dei dati del torneo.', 'error');
    }
}

// 🧼 Reset Completo
// 🧼 Reset Completo
window.resetTorneoForm = function () {
    console.log('RESET del form torneo in corso...');

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
            window.resetTorneoForm();
            console.log("✅ resetTorneoForm eseguito");
        } else {
            console.warn('❌ resetTorneoForm NON trovata');
        }
    });
});
