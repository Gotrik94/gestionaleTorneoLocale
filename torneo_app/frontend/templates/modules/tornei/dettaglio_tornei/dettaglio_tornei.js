// dettaglio_tornei.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Avvio script bracket multi-round...");

  const torneoId = document.getElementById('torneo-container').dataset.torneoId;
  const btnGeneraAuto = document.getElementById('btn-generabracket');

  const tabFasi = document.getElementById('tab-fasi');
  const contenutoFasi = document.getElementById('contenuto-fasi');

  let currentBracketData = null;  // Oggetto usato da jQuery Bracket
  let faseAttuale = null;         // Fase selezionata
  let isBracketConfermato = false;

  // Recupera il nome di una squadra con un certo ID, o "BYE" se ID mancante
  function getNomeSquadraById(squadre, id) {
    if (!id) return "BYE";
    const sq = squadre.find(s => s.id === id);
    return sq ? sq.nome : "Sconosciuta";
  }

  /**
   * buildBracketDataFromFase:
   *  - Se la fase ha partite nel DB, raggruppa per round_num => (teams, results)
   *  - Se NON ci sono partite, potresti creare un bracket vuoto
   */
  function buildBracketDataFromFase(fase) {
    console.log("⚙️ buildBracketDataFromFase per fase ID:", fase.id);

    // Se la fase ha partite, raggruppiamo per round_num.
    // Se partite = 0 e la fase non è confermata, creeremo un bracket vuoto.
    if (!fase.partite || fase.partite.length === 0) {
      // Bracket vuoto: creeremo TOT slot, se vuoi (ad es. 4 slot => 2 match round1)
      // Oppure potresti semplicemente restituire teams vuoti.
      return generaBracketVuoto(fase.squadre);
    }

    // Altrimenti, se ci sono partite
    const roundMap = new Map();
    fase.partite.forEach(p => {
      const r = p.round_num || 1;
      if (!roundMap.has(r)) roundMap.set(r, []);
      roundMap.get(r).push(p);
    });

    const sortedRounds = [...roundMap.keys()].sort((a,b)=>a-b);
    console.log("   - Round trovati:", sortedRounds);

    const bracketTeams = [];
    const bracketResults = [];

    sortedRounds.forEach((roundNumber, roundIndex) => {
      const matches = roundMap.get(roundNumber);
      console.log(`   ↳ Round ${roundNumber}: ${matches.length} partite`);

      // Se è round1 => costruiamo teams
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

      // punteggi
      const punteggiRound = matches.map(m => [
        parseInt(m.punteggio_rossa || 0),
        parseInt(m.punteggio_blu   || 0)
      ]);
      bracketResults.push(punteggiRound);
    });

    const bracketData = { teams: bracketTeams, results: bracketResults };
    console.log("   - bracketData costruito per fase con partite:", bracketData);
    return bracketData;
  }

  // Se la fase non ha partite, e non è confermata, costruiamo uno "schema" di bracket vuoto
  // in base al numero di squadre iscritte, ma lasciamo i campi 'name' vuoti => "TBD"
  function generaBracketVuoto(squadre) {
    console.log("   - Nessuna partita trovata => bracket vuoto");

    // es. prendi la lunghezza "valid" => potresti calcolare la potenza di 2
    // e creare TOT slot, con name="" (che via CSS potrebbe mostrare "TBD")
    const valid = squadre.filter(s=>s.id);
    // nextPow2 => il numero di slot
    const nPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length || 2)));
    // se c'erano 3 squadre => nPow2=4 => 2 match round1 => 1 match round2

    // Creiamo teams come array di dimensione nPow2/2
    const teams = [];
    for (let i = 0; i < nPow2; i += 2) {
      // tutti vuoti => "TBD"
      teams.push([
        { name: "", id: null },
        { name: "", id: null }
      ]);
    }

    // un singolo array results => round1 => punteggio 0-0 per tutti i match
    // se vuoi più round => devi calcolare quante partite per round.
    return {
      teams,
      results: [ teams.map(() => [0,0]) ]
    };
  }

  // Carica dati del torneo
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

      tabFasi.innerHTML = '';
      contenutoFasi.innerHTML = '';

      if (!data.fasi || data.fasi.length === 0) {
        console.warn("⚠️ Nessuna fase trovata");
        return;
      }

      data.fasi.forEach((fase, index) => {
        console.log(`📊 Elaborazione fase ${fase.nome} (ID: ${fase.id})`);

        const dataInizio = new Date(fase.data_inizio);
        const oggi = new Date();
        const faseNonIniziata = dataInizio > oggi;

        // crea tab
        const li = document.createElement('li');
        li.classList.add('nav-item');
        li.innerHTML = `
          <button class="nav-link ${index===0 ? 'active':''}" data-bs-toggle="tab" data-bs-target="#fase-${fase.id}">
            ${fase.nome}
          </button>`;
        tabFasi.appendChild(li);

        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${index===0?'show active':''}`;
        tabPane.id = `fase-${fase.id}`;

        // Se la fase non è ancora iniziata
        if (faseNonIniziata) {
          const formattedDate = dataInizio.toLocaleDateString('it-IT',{ day:'2-digit', month:'2-digit', year:'numeric' })
                                 .replace(/\//g,'-');
          tabPane.innerHTML = `
            <div class="alert alert-warning text-dark p-4 shadow">
              <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
              <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${formattedDate}</strong>.</p>
            </div>
          `;
        } else {
          // bracket container
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
        if (index===0 && !faseNonIniziata) {
          console.log(`🎯 Fase attuale: ${fase.nome} (ID=${fase.id})`);
          faseAttuale = fase;

          // se bracket_confermato => costruiamo bracket dai match
          if (fase.bracket_confermato) {
            console.log("🔒 Fase confermata => costruisco bracket dai match esistenti");
            currentBracketData = buildBracketDataFromFase(fase);
            isBracketConfermato = true;
            nascondiBottoniBracket();
          } else {
            // se non è confermata:
            // 1) se ci sono partite, buildBracketDataFromFase => creerà la struttura
            // 2) se non ci sono partite, buildBracketDataFromFase => generaBracketVuoto
            console.log("🔲 Fase non confermata => vediamo se ci sono partite");
            if (fase.partite && fase.partite.length > 0) {
              currentBracketData = buildBracketDataFromFase(fase);
            } else {
              // bracket totalmente vuoto
              currentBracketData = generaBracketVuoto(fase.squadre);
            }
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

  // Bottoni "Salva" e "Reset"
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

  // Pulsante "Genera bracket automatico"
  if (btnGeneraAuto) {
    btnGeneraAuto.addEventListener('click', () => {
      console.log("🔁 Generazione bracket auto (single-round)");
      if (!faseAttuale || !faseAttuale.squadre || faseAttuale.squadre.length===0) {
        Swal.fire("Errore","Nessuna squadra disponibile","error");
        return;
      }

      const shuffled = [...faseAttuale.squadre].sort(()=>Math.random()-0.5);
      const teams = [];
      while (shuffled.length>0) {
        const t1 = shuffled.shift();
        const t2 = shuffled.shift() || { id:null, nome:"BYE"};
        teams.push([
          { name:t1.nome, id:t1.id },
          { name:t2.nome, id:t2.id }
        ]);
      }

      currentBracketData = {
        teams,
        results:[ teams.map(()=>[0,0]) ]
      };
      console.log("⚙️ Bracket autogenerato =>", currentBracketData);
      renderBracket(currentBracketData, faseAttuale.id);
    });
  }

  // Render bracket con jQuery Bracket
  function renderBracket(data, faseId) {
    console.log(`🎨 Rendering bracket per fase ID=${faseId}`, data);
    if (!data || !data.teams || !data.results) {
      console.warn("❌ Dati bracket incompleti:", data);
      return;
    }
    const bracketContainer = document.getElementById(`bracket-${faseId}`);
    if (!bracketContainer) {
      console.error("❌ Container bracket non trovato:", `bracket-${faseId}`);
      return;
    }

    // Se bracket è confermato, li mostri come "BYE" se stringa vuota
    // Se non è confermato, li mostri come "", così l'utente vede spazi vuoti
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
      disableTeamEdit: true, // usiamo drag & drop personalizzato
      centerConnectors: true,
      teamWidth: 180,
      scoreWidth: 50,
      matchMargin: 40,
      roundMargin: 70,
      save: ()=>{
        console.log("Bracket in sola lettura => no salvataggio automatico");
      }
    });
    console.log("✅ Bracket renderizzato con successo");

    // Se bracket non è confermato => abilito drag & drop
    if (!isBracketConfermato) {
      setTimeout(() => {
        console.log("🖱️ Inizializzo drag & drop .team del bracket");
        const teamEls = bracketContainer.querySelectorAll('.team');
        teamEls.forEach(teamEl => {
          teamEl.addEventListener('dragover', e => e.preventDefault());
          teamEl.addEventListener('drop', e => {
            e.preventDefault();
            const dataDrop = JSON.parse(e.dataTransfer.getData("application/json"));
            // sostituiamo testo
            teamEl.textContent = dataDrop.nome;
            teamEl.dataset.id = dataDrop.id;

            // aggiorna currentBracketData
            const allMatchEls = bracketContainer.querySelectorAll('.match');
            allMatchEls.forEach((matchEl, matchIdx) => {
              const teamNodes = matchEl.querySelectorAll('.team');
              teamNodes.forEach((node, teamIdx) => {
                if (node === teamEl) {
                  currentBracketData.teams[matchIdx][teamIdx] = {
                    name: dataDrop.nome,
                    id: parseInt(dataDrop.id)
                  };
                }
              });
            });
          });
        });
      }, 100);
    }
  }

  // Reset bracket => bracket vuoto
  function resetBracket(faseId) {
    console.log("🔄 Reset bracket per fase:", faseId);
    if (!faseAttuale) return;
    currentBracketData = generaBracketVuoto(faseAttuale.squadre);
    renderBracket(currentBracketData, faseId);
  }

  // Salva bracket
  async function salvaBracket(faseId) {
    try {
      console.log("💾 Salvataggio bracket => faseId:", faseId);
      console.log("   - Dati bracket:", currentBracketData);

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

      loadTorneoData();

    } catch (err) {
      console.error("❌ Errore salvataggio bracket:", err);
      Swal.fire("Errore","Impossibile salvare bracket","error");
    }
  }

  // generaBracketVuoto: se la fase non ha partite e non è confermata, vuoi un bracket "vuoto" (slot TBD).
  function generaBracketVuoto(squadre) {
    console.log("🧱 Creazione bracket vuoto per squadre:", squadre.length);
    const valid = squadre.filter(s=>s.id);

    // es. potresti anche impostare un numero fisso di slot, tipo 4 => 2 match
    // qui calcoliamo la potenza di 2 più vicina
    const nPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length || 2)));

    const teams = [];
    for (let i=0; i<nPow2; i+=2) {
      // due slot vuoti => name=""
      teams.push([
        { name:"", id:null },
        { name:"", id:null }
      ]);
    }

    // results => un solo round di punteggi => 0-0
    // se ti servono più round => devi calcolare la struttura in base a nPow2
    const results = [ teams.map(()=>[0,0]) ];

    return { teams, results };
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

    squadre.forEach(s => {
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

  function getCookie(name) {
    const val = `; ${document.cookie}`;
    const parts = val.split(`; ${name}=`);
    if (parts.length===2) return parts.pop().split(';').shift();
  }

  function nascondiBottoniBracket() {
    document.querySelectorAll('.btn-salvabracket, .btn-resetbracket, #btn-generabracket')
      .forEach(btn => btn.style.display='none');
  }

  // Avvio caricamento
  console.log("🚀 Caricamento dati del torneo avviato");
  loadTorneoData();
});
