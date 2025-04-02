document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM Caricato, avvio script...");

  const torneoId = document.getElementById('torneo-container').dataset.torneoId;
  const btnGeneraAuto = document.getElementById('btn-generabracket');

  const tabFasi = document.getElementById('tab-fasi');
  const contenutoFasi = document.getElementById('contenuto-fasi');

  let currentBracketData = null;
  let faseAttuale = null;


    // 🔁 Converte le partite salvate dal backend in formato bracket
  function getBracketFromPartite(fase) {
    return {
      teams: fase.partite.map(p => [
        { name: getNomeSquadraById(fase.squadre, p.squadra_rossa), id: p.squadra_rossa },
        { name: getNomeSquadraById(fase.squadre, p.squadra_blu), id: p.squadra_blu }
      ]),
      results: [fase.partite.map(p => [0, 0])], // Puoi usare anche punteggi se ce li hai
      partiteIds: fase.partite.map(p => p.id)
    };
  }

  // 🔍 Recupera nome della squadra dato l'id
  function getNomeSquadraById(squadre, id) {
    const squadra = squadre.find(s => s.id === id);
    return squadra ? squadra.nome : '';
  }


  // 📦 Carica dati del torneo e genera contenuti
  async function loadTorneoData() {
    try {
      const response = await fetch(`/api/dettaglio/${torneoId}/dettaglio/`);
      if (!response.ok) throw new Error("Errore caricamento dati");

      const data = await response.json();
      console.log("✅ Dati torneo:", data);

      tabFasi.innerHTML = '';
      contenutoFasi.innerHTML = '';

      data.fasi.forEach((fase, index) => {
        const oggi = new Date();
        const dataInizioFase = new Date(fase.data_inizio);
        const faseNonIniziata = dataInizioFase > oggi;

        // 🧱 Crea Tab
        const tab = document.createElement('li');
        tab.classList.add('nav-item');
        tab.innerHTML = `
          <button class="nav-link ${index === 0 ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#fase-${fase.id}">
            ${fase.nome}
          </button>`;
        tabFasi.appendChild(tab);

        // 🧱 Crea Contenuto della fase
        const content = document.createElement('div');
        content.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        content.id = `fase-${fase.id}`;

        if (faseNonIniziata) {
          content.innerHTML = `
            <div class="alert alert-warning text-dark p-4 shadow">
              <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
              <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${fase.data_inizio}</strong>.</p>
            </div>`;
        } else {
          content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-warning">Bracket: ${fase.nome}</h5>
              <div class="bracket-actions">
                <button class="btn btn-danger btn-sm btn-resetbracket"><i class="fa fa-trash"></i> Reset Bracket</button>
                <button class="btn btn-success btn-sm btn-salvabracket"><i class="fa fa-save"></i> Salva Bracket</button>
              </div>
            </div>
            <div class="bracket-wrapper"><div id="bracket-${fase.id}"></div></div>`;
        }

        contenutoFasi.appendChild(content);

        // ⚡ Solo per la prima fase attiva
        if (index === 0 && !faseNonIniziata) {
          faseAttuale = fase;

          if (fase.partite?.length) {
            currentBracketData = getBracketFromPartite(fase);
            console.log("🔁 Bracket da partite:", currentBracketData);
          } else {
            currentBracketData = generaBracketPlaceholder(fase.squadre);
            console.log("🔲 Bracket placeholder generato:", currentBracketData);
          }

          renderBracket(currentBracketData, fase.id);
          renderSquadreDisponibili(fase.squadre);
        }
      });

      bindBracketButtons();
    } catch (err) {
      console.error("❌ Errore caricamento dati:", err);
    }
  }

  // 🔁 Collegamento dei bottoni per salvare e resettare
  function bindBracketButtons() {
    document.querySelectorAll('.btn-salvabracket').forEach(btn => {
      btn.addEventListener('click', () => {
        if (faseAttuale?.id) salvaBracket(faseAttuale.id);
      });
    });

    document.querySelectorAll('.btn-resetbracket').forEach(btn => {
      btn.addEventListener('click', () => {
        if (faseAttuale?.id) resetBracket(faseAttuale.id);
      });
    });
  }

  // 🧠 Pulsante: Genera Bracket Automatico
  if (btnGeneraAuto) {
    btnGeneraAuto.addEventListener('click', () => {
      console.log("🔁 Generazione automatica bracket avviata");

      if (!faseAttuale?.squadre?.length) {
        Swal.fire("Errore", "Nessuna squadra disponibile per generare il bracket", "error");
        return;
      }

      const shuffled = [...faseAttuale.squadre].sort(() => Math.random() - 0.5);
      const teams = [];

      while (shuffled.length > 0) {
        const team1 = shuffled.shift();
        const team2 = shuffled.shift() || { id: null, nome: "BYE" };

        teams.push([
          { name: team1.nome, id: team1.id },
          { name: team2.nome, id: team2.id }
        ]);
      }

      currentBracketData = {
        teams,
        results: [teams.map(() => [0, 0])],
        partiteIds: []
      };

      console.log("⚙️ Bracket auto-generato:", currentBracketData);
      renderBracket(currentBracketData, faseAttuale.id);
    });
  }

    // 🖼️ Render Bracket
    function renderBracket(data, faseId) {
      const bracketContainer = $(`#bracket-${faseId}`);
      bracketContainer.empty().bracket({
        init: {
          teams: data.teams.map(match => [match[0].name || '', match[1].name || '']),
          results: data.results
        },
        disableToolbar: true,
        disableTeamEdit: true,
        save: data.partiteIds?.length > 0
          ? (matchData, roundIdx, matchIdx) => {
              const partitaId = data.partiteIds[matchIdx];
              if (!partitaId) return;
              fetch(`/api/dettaglio/partita/${partitaId}/aggiorna/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                  punteggio_rossa: matchData.score[0],
                  punteggio_blu: matchData.score[1]
                })
              })
                .then(res => res.json())
                .then(res => console.log("✅ Risultato aggiornato:", res))
                .catch(err => console.error("❌ Errore aggiornamento:", err));
            }
          : () => console.log("💾 Bracket placeholder, nessun salvataggio")
      });

      // ⬇️ Rendi i blocchi droppabili e aggiorna il currentBracketData
      setTimeout(() => {
        document.querySelectorAll(`#bracket-${faseId} .team`).forEach(teamEl => {
          teamEl.addEventListener('dragover', e => {
            e.preventDefault(); // 🔓 Permette il drop
          });

          teamEl.addEventListener('drop', e => {
            e.preventDefault();

            const dataDrop = JSON.parse(e.dataTransfer.getData("application/json"));
            console.log("🧲 Squadra droppata:", dataDrop);

            // 1. Aggiorna visivamente il blocco
            teamEl.textContent = dataDrop.nome;
            teamEl.dataset.id = dataDrop.id;
            teamEl.dataset.nome = dataDrop.nome;
            teamEl.style.backgroundColor = "#4CAF50";

            // 2. Sincronizza con currentBracketData
            const allMatchEls = [...document.querySelectorAll(`#bracket-${faseId} .match`)];

            allMatchEls.forEach((matchEl, matchIdx) => {
              const teamNodes = matchEl.querySelectorAll('.team');
              teamNodes.forEach((node, teamIdx) => {
                if (node === teamEl) {
                  console.log(`📦 Aggiorno currentBracketData. Match: ${matchIdx}, Slot: ${teamIdx}`);
                  currentBracketData.teams[matchIdx][teamIdx] = {
                    name: dataDrop.nome,
                    id: parseInt(dataDrop.id)
                  };
                }
              });
            });

            console.log("🧠 currentBracketData aggiornato:", currentBracketData);
          });
        });
      }, 100); // Tempo per assicurarsi che il DOM dei match sia pronto
    }



  // 🔄 Reset del bracket corrente
  function resetBracket(faseId) {
    if (!faseAttuale) return;
    currentBracketData = generaBracketPlaceholder(faseAttuale.squadre);
    renderBracket(currentBracketData, faseId);
    console.log("🔃 Bracket resettato");
  }

      // 💾 Salvataggio bracket
    async function salvaBracket(faseId) {
      try {
        // 🧼 Pulizia: rimuovi squadre con ID null o non validi
        const cleanedBracket = {
          ...currentBracketData,
          teams: currentBracketData.teams.map(match => match.map(team => {
            if (!team?.id || isNaN(team.id)) {
              return null;  // segna come slot vuoto
            }
            return { id: team.id, name: team.name };
          })),
          results: currentBracketData.results
        };

        // 🔁 Rimuovi i match completamente vuoti
        cleanedBracket.teams = cleanedBracket.teams.filter(pair => pair && (pair[0] || pair[1]));

        console.log("💾 Bracket da inviare:", cleanedBracket);

        const response = await fetch(`/api/dettaglio/fase/${faseId}/salva_bracket/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: JSON.stringify({ bracket: cleanedBracket })
        });

        const result = await response.json();
        if (!response.ok) throw result;

        console.log("✅ Bracket salvato:", result);
        await loadTorneoData();
      } catch (err) {
        console.error("❌ Errore salvataggio bracket:", err);
      }
    }

  // 🧱 Bracket vuoto con BYE
  function generaBracketPlaceholder(squadre) {
    const valid = squadre.filter(s => s.id);
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length)));
    while (valid.length < nextPow2) valid.push({ id: null, nome: "" });

    const teams = [];
    for (let i = 0; i < valid.length; i += 2) {
      teams.push([
        { name: '', id: valid[i]?.id || null },
        { name: '', id: valid[i + 1]?.id || null }
      ]);
    }

    return { teams, results: [teams.map(() => [0, 0])], partiteIds: [] };
  }

  // 🧩 Lista laterale squadre disponibili
  function renderSquadreDisponibili(squadre) {
    const container = document.getElementById('squadre-disponibili');
    if (!container) return console.warn("⚠️ Container squadre-disponibili non trovato");

    container.innerHTML = '';
    squadre.forEach(s => {
      const el = document.createElement('div');
      el.classList.add('draggable-squadra', 'alert', 'alert-secondary', 'mb-2', 'p-2');
      el.draggable = true;
      el.dataset.id = s.id;
      el.dataset.nome = s.nome;
      el.textContent = s.nome;

      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id, nome: s.nome }));
      });

      container.appendChild(el);
    });
  }

  // 🍪 Recupero cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  // 🚀 Avvia caricamento dati
  loadTorneoData();
});
