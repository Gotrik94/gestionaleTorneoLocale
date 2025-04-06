// dettaglio_tornei.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Avvio script bracket multi-round...");

  const torneoId = document.getElementById('torneo-container').dataset.torneoId;
  const btnGeneraAuto = document.getElementById('btn-generabracket');

  const tabFasi = document.getElementById('tab-fasi');
  const contenutoFasi = document.getElementById('contenuto-fasi');

  let currentBracketData = null;  // Oggetto che passeremo a jQuery Bracket
  let faseAttuale = null;         // Fase selezionata
  let isBracketConfermato = false;

  // 🔎 Recupera nome di una squadra in base al suo ID
  function getNomeSquadraById(squadre, id) {
    if (!id) return "BYE";  // se manca l'ID, consideriamo un bye
    const sq = squadre.find(s => s.id === id);
    return sq ? sq.nome : "Sconosciuta";
  }

  /**
   * buildBracketDataFromFase:
   *   - raggruppa le partite per round_num (1,2,...)
   *   - teams[] è derivato dalle partite di round1
   *   - results[]: results[i] contiene i punteggi delle partite di round i
   *
   *  jQuery Bracket si aspetta:
   *    { teams: [ [teamA, teamB], [teamC, teamD], ...],
   *      results: [
   *         [ [scoreA,scoreB], [scoreC,scoreD], ...], // round1
   *         [ [scoreE,scoreF], ...],                  // round2
   *         ...
   *      ]
   *    }
   */
function buildBracketDataFromFase(fase) {
  console.log("⚙️ buildBracketDataFromFase per fase ID:", fase.id);

  // Raggruppa le partite in base a round_num
  const roundMap = new Map();
  fase.partite.forEach(p => {
    const r = p.round_num || 1;
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r).push(p);
  });

  // Ordina i round in modo crescente
  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
  console.log("   - Round trovati:", sortedRounds);

  const bracketTeams = [];   // Solo dal primo round
  const bracketResults = []; // Per i punteggi round1, round2, ecc.

  sortedRounds.forEach((roundNumber, roundIndex) => {
    const matches = roundMap.get(roundNumber);
    console.log(`   ↳ Round ${roundNumber}: ${matches.length} partite`);

    // Se è il primo round, costruiamo teams[] con oggetti { name, id }
    if (roundIndex === 0) {
      matches.forEach(m => {
        const nomeRossa = getNomeSquadraById(fase.squadre, m.squadra_rossa);
        const nomeBlu   = getNomeSquadraById(fase.squadre, m.squadra_blu);

        bracketTeams.push([
          { name: nomeRossa, id: m.squadra_rossa || null },
          { name: nomeBlu,   id: m.squadra_blu   || null }
        ]);
      });
    }

    // Per i punteggi, sia round1 che round2, etc.
    const punteggiRound = matches.map(m => {
      const pr = parseInt(m.punteggio_rossa || 0);
      const pb = parseInt(m.punteggio_blu || 0);
      return [pr, pb];
    });

    bracketResults.push(punteggiRound);
  });

  // jQuery Bracket aspetta un oggetto con 'teams' e 'results'
  const bracketData = {
    teams: bracketTeams,
    results: bracketResults
  };

  console.log("   - bracketData costruito per fase:", bracketData);
  return bracketData;
}


  // 📦 Carica dati del torneo e genera i bracket
  async function loadTorneoData() {
    try {
      console.log(`📡 Caricamento dati torneo ${torneoId}...`);
      const resp = await fetch(`/api/dettaglio/${torneoId}/dettaglio/`);
      if (!resp.ok) {
        console.error(`❌ Errore HTTP: ${resp.status}`);
        throw new Error(`Errore caricamento dati: ${resp.statusText}`);
      }

      const data = await resp.json();
      console.log("✅ Dati torneo ricevuti:", data);

      // Reset dei contenitori
      tabFasi.innerHTML = '';
      contenutoFasi.innerHTML = '';

      if (!data.fasi || data.fasi.length === 0) {
        console.warn("⚠️ Nessuna fase trovata");
        return;
      }

      data.fasi.forEach((fase, idx) => {
        console.log(`📊 Elaborazione fase ${fase.nome} (ID: ${fase.id})`);
        const dataInizio = new Date(fase.data_inizio);
        const oggi = new Date();
        const faseNonIniziata = dataInizio > oggi;

        // Creazione linguetta (tab)
        const li = document.createElement('li');
        li.classList.add('nav-item');
        li.innerHTML = `
          <button class="nav-link ${idx === 0 ? 'active' : ''}"
                  data-bs-toggle="tab"
                  data-bs-target="#fase-${fase.id}">
            ${fase.nome}
          </button>
        `;
        tabFasi.appendChild(li);

        // Creazione contenuto tab
        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${idx === 0 ? 'show active' : ''}`;
        tabPane.id = `fase-${fase.id}`;

        // Se la fase deve iniziare in futuro, mostraci un avviso
        if (faseNonIniziata) {
          const formattedDate = dataInizio.toLocaleDateString('it-IT', {
            day:'2-digit', month:'2-digit', year:'numeric'
          }).replace(/\//g, '-');

          tabPane.innerHTML = `
            <div class="alert alert-warning text-dark p-4 shadow">
              <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
              <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${formattedDate}</strong>.</p>
            </div>
          `;
        } else {
          // Altrimenti, predisponiamo un contenitore bracket
          tabPane.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-warning">Bracket: ${fase.nome}</h5>
              <div class="bracket-actions">
                <button class="btn btn-danger btn-sm btn-resetbracket"><i class="fa fa-trash"></i> Reset Bracket</button>
                <button class="btn btn-success btn-sm btn-salvabracket"><i class="fa fa-save"></i> Salva Bracket</button>
              </div>
            </div>
            <div class="bracket-wrapper">
              <div id="bracket-${fase.id}"></div>
            </div>
          `;
        }

        contenutoFasi.appendChild(tabPane);

        // Se è la prima fase e non è futura
        if (idx===0 && !faseNonIniziata) {
          console.log(`🎯 Fase attuale: ${fase.nome} (ID=${fase.id})`);
          faseAttuale = fase;

          if (fase.bracket_confermato) {
            console.log("🔒 Bracket confermato => generazione bracket multi-round da partite");
            currentBracketData = buildBracketDataFromFase(fase);
            isBracketConfermato = true;
            nascondiBottoniBracket();
          } else {
            console.log("🔲 Fase non confermata => bracket placeholder");
            currentBracketData = generaBracketPlaceholder(fase.squadre);
            isBracketConfermato = false;
          }
          console.log("👉 Rendering bracket con i dati:", currentBracketData);
          renderBracket(currentBracketData, fase.id);
          renderSquadreDisponibili(fase.squadre);
        }
      });

      bindBracketButtons();

    } catch (err) {
      console.error("❌ Errore caricamento dati:", err);
    }
  }

  // Collega i bottoni 'Salva' e 'Reset'
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

  // Pulsante "Genera bracket" automatico (per un bracket single-round di base)
  if (btnGeneraAuto) {
    btnGeneraAuto.addEventListener('click', () => {
      console.log("🔁 Generazione bracket auto (single-round) avviata");
      if (!faseAttuale || !faseAttuale.squadre || faseAttuale.squadre.length===0) {
        Swal.fire("Errore", "Nessuna squadra per generare bracket", "error");
        return;
      }
      // Mix random
      const shuffled = [...faseAttuale.squadre].sort(()=>Math.random()-0.5);
      const teams = [];
      while (shuffled.length>0) {
        const t1 = shuffled.shift();
        const t2 = shuffled.shift() || { id:null, nome:"BYE" };
        teams.push([
          { name: t1.nome, id:t1.id },
          { name: t2.nome, id:t2.id }
        ]);
      }
      // Bracket con un solo round => results: [ [ [0,0], [0,0], ... ] ]
      currentBracketData = {
        teams,
        results: [ teams.map(()=>[0,0]) ]
      };
      console.log("⚙️ Bracket auto-generato =>", currentBracketData);
      renderBracket(currentBracketData, faseAttuale.id);
    });
  }

  // Render bracket con jQuery Bracket
  function renderBracket(data, faseId) {
    console.log(`🎨 Rendering bracket per fase ID=${faseId}`, data);
    if (!data || !data.teams || !data.results) {
      console.warn("❌ Dati bracket non validi o incompleti:", data);
      return;
    }
    const bracketContainer = document.getElementById(`bracket-${faseId}`);
    if (!bracketContainer) {
      console.error("❌ Container bracket non trovato:", `bracket-${faseId}`);
      return;
    }

    // Trasforma i teams in stringhe
    const finalTeams = data.teams.map(match => [
      (isBracketConfermato ? (match[0]?.name || "BYE") : (match[0]?.name || "")),
      (isBracketConfermato ? (match[1]?.name || "BYE") : (match[1]?.name || "")),
    ]);

    console.log("   - finalTeams:", JSON.stringify(finalTeams));
    console.log("   - results:", JSON.stringify(data.results));

    $(bracketContainer).empty().bracket({
      init: {
        teams: finalTeams,
        results: data.results
      },
      skipConsolationRound: true,
      disableToolbar: true,
      disableTeamEdit: true,
      teamWidth: 160,
      scoreWidth: 40,
      matchMargin: 20,
      roundMargin: 40,
      centerConnectors: true,
      save: ()=>{
        console.log("Modalità sola lettura => no salvataggio");
      }
    });
    console.log("✅ Bracket renderizzato con successo");
  }

  // Reset bracket (placeholder)
  function resetBracket(faseId) {
    console.log("🔄 Reset bracket per fase:", faseId);
    if (!faseAttuale) return;
    currentBracketData = generaBracketPlaceholder(faseAttuale.squadre);
    renderBracket(currentBracketData, faseId);
  }

  // Salvataggio bracket
  async function salvaBracket(faseId) {
    try {
      console.log("💾 Salvataggio bracket => faseId:", faseId);
      console.log("   - Dati bracket:", currentBracketData);

      // Puliamo i team (niente ID non validi)
      const bracketToSend = {
        ...currentBracketData,
        teams: currentBracketData.teams.map(match => match.map(tm=>{
          if (!tm || !tm.id) return null;
          return { id: tm.id, name: tm.name };
        }))
      };

      const res = await fetch(`/api/dettaglio/fase/${faseId}/salva_bracket/`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ bracket: bracketToSend })
      });
      if (!res.ok) throw await res.json();
      const data = await res.json();
      console.log("   - Risposta salvataggio bracket =>", data);

      Swal.fire("Bracket salvato!", "Il bracket è stato confermato", "success");
      isBracketConfermato = true;
      nascondiBottoniBracket();

      // Ricarichiamo
      loadTorneoData();
    } catch (err) {
      console.error("❌ Errore salvataggio bracket:", err);
      Swal.fire("Errore", "Impossibile salvare bracket", "error");
    }
  }

  // generaBracketPlaceholder => potenza di 2 con BYE
  function generaBracketPlaceholder(squadre) {
    console.log("🧱 Generazione placeholder bracket => squadre:", squadre.length);
    const valid = squadre.filter(s=>s.id);
    const nPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length)));
    while (valid.length < nPow2) valid.push({ id:null, nome:"" });

    const teams = [];
    for (let i=0; i<valid.length; i+=2) {
      teams.push([
        { name: valid[i]?.nome || "", id: valid[i]?.id || null },
        { name: valid[i+1]?.nome || "", id: valid[i+1]?.id || null }
      ]);
    }
    return {
      teams,
      results:[ teams.map(()=>[0,0]) ]
    };
  }

  // Squadre draggabili (solo se bracket non confermato)
  function renderSquadreDisponibili(squadre) {
    const container = document.getElementById('squadre-disponibili');
    if (!container) return;

    container.innerHTML = '';
    if (isBracketConfermato) {
      container.innerHTML = `<div class="alert alert-info text-center">Bracket confermato, non modificabile.</div>`;
      return;
    }
    squadre.forEach(s=>{
      const el = document.createElement('div');
      el.className = 'draggable-squadra alert alert-secondary mb-2 p-2';
      el.draggable = true;
      el.dataset.id = s.id;
      el.dataset.nome = s.nome;
      el.textContent = s.nome;
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData("application/json", JSON.stringify({ id:s.id, nome:s.nome }));
      });
      container.appendChild(el);
    });
  }

  // Utility cookie django
  function getCookie(name) {
    const val = `; ${document.cookie}`;
    const parts = val.split(`; ${name}=`);
    if (parts.length===2) return parts.pop().split(';').shift();
  }

  // Nascondi pulsanti se bracket è confermato
  function nascondiBottoniBracket() {
    document.querySelectorAll('.btn-salvabracket, .btn-resetbracket, #btn-generabracket')
      .forEach(btn => btn.style.display='none');
  }

  // Avvio caricamento
  console.log("🚀 Caricamento dati del torneo avviato");
  loadTorneoData();
});
