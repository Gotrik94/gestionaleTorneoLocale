// dettaglio_tornei.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Avvio script bracket multi-round...");

  const torneoId = document.getElementById('torneo-container').dataset.torneoId;
  const btnGeneraAuto = document.getElementById('btn-generabracket');

  const tabFasi = document.getElementById('tab-fasi');
  const contenutoFasi = document.getElementById('contenuto-fasi');

  let currentBracketData = null;  // Oggetto usato da jQuery Bracket per la fase attuale
  let faseAttuale = null;         // Fase attualmente visualizzata (attiva)
  let isBracketConfermato = false;

  // Recupera il nome della squadra dato il suo ID, oppure "BYE" se non esiste
  function getNomeSquadraById(squadre, id) {
    if (!id) return "BYE";
    const sq = squadre.find(s => s.id === id);
    return sq ? sq.nome : "Sconosciuta";
  }

  /**
   * buildBracketDataFromFase:
   * - Se la fase ha partite, raggruppa le partite per round_num.
   *   -> Il primo round definisce l'array teams (coppie di oggetti { name, id }).
   *   -> Per ogni round, si crea un array di punteggi in results.
   * - Se non ci sono partite, si chiama generaBracketVuoto (slot vuoti).
   */
  function buildBracketDataFromFase(fase) {
    console.log("⚙️ buildBracketDataFromFase per fase ID:", fase.id);

    if (!fase.partite || fase.partite.length === 0) {
      console.log("   - Nessuna partita trovata => genero bracket vuoto");
      return generaBracketVuoto(fase.squadre);
    }

    // Raggruppiamo le partite per round_num
    const roundMap = new Map();
    fase.partite.forEach(p => {
      const r = p.round_num || 1;
      if (!roundMap.has(r)) roundMap.set(r, []);
      roundMap.get(r).push(p);
    });

    // Ordiniamo i round in modo crescente
    const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
    console.log("   - Round trovati:", sortedRounds);

    const bracketTeams = [];
    const bracketResults = [];

    sortedRounds.forEach((roundNumber, roundIndex) => {
      const matches = roundMap.get(roundNumber);
      console.log(`   ↳ Round ${roundNumber}: ${matches.length} partite`);

      // Se è il primo round => definiamo teams
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

      // Definiamo i punteggi per il round
      const punteggiRound = matches.map(m => [
        parseInt(m.punteggio_rossa || 0),
        parseInt(m.punteggio_blu   || 0)
      ]);
      bracketResults.push(punteggiRound);
    });

    const bracketData = { teams: bracketTeams, results: bracketResults };
    console.log("   - bracketData costruito per fase:", bracketData);
    return bracketData;
  }

  /**
   * generaBracketVuoto:
   * Se la fase non ha partite, crea un bracket con slot vuoti.
   * Calcola la potenza di 2 >= numero di squadre iscritte, e per ogni coppia crea { name:"", id:null }.
   */
  function generaBracketVuoto(squadre) {
    console.log("🧱 Creazione bracket vuoto per squadre:", squadre.length);
    const valid = squadre.filter(s => s.id);
    const nPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length || 2)));

    const teams = [];
    for (let i = 0; i < nPow2; i += 2) {
      teams.push([
        { name: "", id: null },
        { name: "", id: null }
      ]);
    }

    // Risultati: un array per ogni round => qui un singolo round di punteggi 0-0
    const results = [ teams.map(() => [0, 0]) ];
    return { teams, results };
  }

  /**
   * renderSquadreDisponibili:
   * Rende la lista di squadre draggabili per la singola fase
   * dentro un container specifico (es. "squadre-disponibili-{fase.id}").
   */
  function renderSquadreDisponibili(squadre, containerId) {
    const container = document.getElementById(containerId);
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

      // Dragstart => passiamo ID e nome in dataTransfer
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id, nome: s.nome }));
      });

      container.appendChild(el);
    });
  }

  // Carica i dati del torneo e genera le schede (tab) per ogni fase
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

      // Crea una scheda per ogni fase
      data.fasi.forEach((fase, idx) => {
        console.log(`📊 Elaborazione fase ${fase.nome} (ID: ${fase.id})`);
        const dataInizio = new Date(fase.data_inizio);
        const oggi = new Date();
        const faseNonIniziata = dataInizio > oggi;

        // Crea la linguetta
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

        // Crea il contenuto tab (tab-pane)
        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${idx === 0 ? 'show active' : ''}`;
        tabPane.id = `fase-${fase.id}`;

        // Se la fase deve ancora iniziare, mostriamo un avviso
        if (faseNonIniziata) {
          const formattedDate = dataInizio.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).replace(/\//g, '-');

          tabPane.innerHTML = `
            <div class="alert alert-warning text-dark p-4 shadow">
              <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
              <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${formattedDate}</strong>.</p>
            </div>
          `;
        } else {
          // Se la fase è iniziata, generiamo la struttura a due colonne:
          // - colonna sinistra: squadre disponibili
          // - colonna destra: bracket
          tabPane.innerHTML = `
            <div class="row">
              <div class="col-md-3">
                <div class="card bg-dark text-light shadow-sm mb-3">
                  <div class="card-header text-warning">Squadre disponibili</div>
                  <div class="card-body" id="squadre-disponibili-${fase.id}">
                    <!-- Squadre generate da JS -->
                  </div>
                </div>
              </div>
              <div class="col-md-9">
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
              </div>
            </div>
          `;
        }

        // Aggiungiamo il tab-pane al contenitore
        contenutoFasi.appendChild(tabPane);

        // Se è la prima fase (idx===0) e non è futura, la consideriamo la faseAttuale
        if (idx === 0 && !faseNonIniziata) {
          console.log(`🎯 Fase attuale: ${fase.nome} (ID=${fase.id})`);
          faseAttuale = fase;

          // Se la fase ha bracket confermato => generiamo i dati dalle partite
          if (fase.bracket_confermato) {
            console.log("🔒 Fase confermata => costruiamo bracket dai match esistenti");
            currentBracketData = buildBracketDataFromFase(fase);
            isBracketConfermato = true;
            nascondiBottoniBracket();
          } else {
            console.log("🔲 Fase non confermata => verifichiamo partite");
            if (fase.partite && fase.partite.length > 0) {
              currentBracketData = buildBracketDataFromFase(fase);
            } else {
              currentBracketData = generaBracketVuoto(fase.squadre);
            }
            isBracketConfermato = false;
          }

          console.log("👉 Rendering bracket con i dati:", currentBracketData);
          // Render bracket
          renderBracket(currentBracketData, fase.id);
          // Render squadre disponibili
          renderSquadreDisponibili(fase.squadre, `squadre-disponibili-${fase.id}`);
        }
      });

      // Colleghiamo i bottoni "Reset" e "Salva" appena creati
      bindBracketButtons();

    } catch (err) {
      console.error("❌ Errore caricamento dati:", err);
    }
  }

  // Collega i bottoni "Salva Bracket" e "Reset Bracket"
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

  // Pulsante "Genera bracket automatico" (single-round)
  if (btnGeneraAuto) {
    btnGeneraAuto.addEventListener('click', () => {
      console.log("🔁 Generazione bracket auto (single-round)");
      if (!faseAttuale || !faseAttuale.squadre || faseAttuale.squadre.length === 0) {
        Swal.fire("Errore", "Nessuna squadra disponibile", "error");
        return;
      }
      const shuffled = [...faseAttuale.squadre].sort(() => Math.random() - 0.5);
      const teams = [];
      while (shuffled.length > 0) {
        const t1 = shuffled.shift();
        const t2 = shuffled.shift() || { id: null, nome: "BYE" };
        teams.push([
          { name: t1.nome, id: t1.id },
          { name: t2.nome, id: t2.id }
        ]);
      }
      currentBracketData = {
        teams,
        results: [teams.map(() => [0, 0])]
      };
      console.log("⚙️ Bracket autogenerato =>", currentBracketData);
      renderBracket(currentBracketData, faseAttuale.id);
    });
  }

  // Renderizza il bracket con jQuery Bracket
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

    // Se bracket è confermato => sostituiamo i vuoti con "BYE"
    const finalTeams = data.teams.map(match => [
      (isBracketConfermato ? (match[0]?.name || "BYE") : (match[0]?.name || "")),
      (isBracketConfermato ? (match[1]?.name || "BYE") : (match[1]?.name || ""))
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
      save: () => {
        console.log("Bracket in sola lettura => nessun salvataggio automatico");
      }
    });
    console.log("✅ Bracket renderizzato con successo");

    // Se non è confermato, abilitiamo drag & drop
    if (!isBracketConfermato) {
      setTimeout(() => {
        console.log("🖱️ Inizializzo drag & drop per le squadre nel bracket");
        const teamEls = bracketContainer.querySelectorAll('.team');
        teamEls.forEach(teamEl => {
          // Se il campo è vuoto => aggiunge la classe "empty-slot"
          if (teamEl.textContent.trim() === "") {
            teamEl.classList.add("empty-slot");
          }
          teamEl.addEventListener('dragover', e => e.preventDefault());
          teamEl.addEventListener('drop', e => {
            e.preventDefault();
            const dataDrop = JSON.parse(e.dataTransfer.getData("application/json"));
            teamEl.textContent = dataDrop.nome;
            teamEl.dataset.id = dataDrop.id;
            teamEl.classList.remove("empty-slot");
            // Aggiorna currentBracketData
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

  // Salva bracket (chiamata API)
  async function salvaBracket(faseId) {
    try {
      console.log("💾 Salvataggio bracket => faseId:", faseId);
      console.log("   - Dati bracket:", currentBracketData);
      const bracketToSend = {
        ...currentBracketData,
        teams: currentBracketData.teams.map(match => match.map(tm => {
          if (!tm || !tm.id) return null;
          return { id: tm.id, name: tm.name };
        }))
      };
      const res = await fetch(`/api/dettaglio/fase/${faseId}/salva_bracket/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      Swal.fire("Errore", "Impossibile salvare bracket", "error");
    }
  }

  // Utility: recupera cookie (Django)
  function getCookie(name) {
    const val = `; ${document.cookie}`;
    const parts = val.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  // Nascondi i bottoni se bracket è confermato
  function nascondiBottoniBracket() {
    document.querySelectorAll('.btn-salvabracket, .btn-resetbracket, #btn-generabracket')
      .forEach(btn => btn.style.display = 'none');
  }

  // Avvio caricamento
  console.log("🚀 Caricamento dati del torneo avviato");
  loadTorneoData();
});
