let currentStep = 1;
const totalSteps = 3;
const stepElements = document.querySelectorAll('.step');
const torneoData = { fasi: [] };

document.addEventListener('DOMContentLoaded', () => {
    showStep(currentStep);
});

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

function showStep(step) {
    // Nascondi tutti gli step
    document.querySelectorAll('.step').forEach(el => {
        el.classList.add('d-none');
        el.classList.remove('active');
    });

    // Mostra solo quello corrente
    const currentStepEl = document.querySelector(`.step[data-step='${step}']`);
    if (currentStepEl) {
        currentStepEl.classList.remove('d-none');
        currentStepEl.classList.add('active');
    }
}


function nextStep() {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        updateSelectFasi();
    } else {
        console.log('TorneoData completo prima dell\'invio:', JSON.stringify(torneoData, null, 2));
        submitTorneo(); // chiamata API finale
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}


// Gestione Fasi
function aggiungiFase() {
    const nomeFase = prompt("Nome della fase:");
    const dataInizio = prompt("Data inizio (yyyy-mm-dd):");
    const dataFine = prompt("Data fine (yyyy-mm-dd):");

    if(nomeFase && dataInizio && dataFine) {
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

// Gestione Gironi
function aggiungiGirone() {
    const faseIndex = document.getElementById('selectFaseGirone').value;
    const nomeGirone = prompt("Nome del girone:");

    if(nomeGirone) {
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

// Submit Torneo finale
function submitTorneo() {
    console.log('Inizio submitTorneo - Recupero dati dal form');

    try {
        // Recupero valori dal form
        torneoData.nome = document.getElementById('nomeTorneo').value;
        torneoData.data_inizio = document.getElementById('dataInizio').value;
        torneoData.data_fine = document.getElementById('dataFine').value;
        torneoData.fascia_oraria = document.getElementById('fasciaOraria').value;
        torneoData.formato = document.getElementById('formato').value;

        console.log('Dati torneo preparati:', JSON.stringify(torneoData, null, 2));

        console.log('Invio richiesta POST a /api/tornei/lista_tornei/');
        fetch('/api/tornei/lista_tornei/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(torneoData)
        })
        .then(res => {
            console.log('Ricevuta risposta dal server. Status:', res.status);
            if (!res.ok) {
                console.error('Errore HTTP:', res.statusText);
                return res.json().then(errData => {
                    console.error('Dettagli errore:', errData);
                    throw new Error(errData.message || 'Errore durante la richiesta');
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('Successo - Risposta dal server:', data);
            Swal.fire('Successo!', 'Torneo creato correttamente.', 'success');
            setTimeout(() => {
                console.log('Ricaricamento pagina...');
                location.reload();
            }, 1500);
        })
        .catch(err => {
            console.error('Errore durante il fetch:', err);
            Swal.fire('Errore', err.message || 'Si è verificato un errore durante la creazione del torneo.', 'error');
        });

    } catch (error) {
        console.error('Errore durante la preparazione dei dati:', error);
        Swal.fire('Errore', 'Si è verificato un errore durante la preparazione dei dati del torneo.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente caricato - Inizializzazione step');
    showStep(currentStep);
});

function aggiungiFaseDaForm() {
    const nome = document.getElementById('inputNomeFase').value;
    const dataInizio = document.getElementById('inputDataInizioFase').value;
    const dataFine = document.getElementById('inputDataFineFase').value;

    if (!nome || !dataInizio || !dataFine) {
        Swal.fire('Attenzione', 'Compila tutti i campi della fase', 'warning');
        return;
    }

    torneoData.fasi.push({
        nome: nome,
        data_inizio: dataInizio,
        data_fine: dataFine,
        gironi: []
    });

    aggiornaListaFasi();

    // Pulisci i campi
    document.getElementById('inputNomeFase').value = '';
    document.getElementById('inputDataInizioFase').value = '';
    document.getElementById('inputDataFineFase').value = '';
}

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


