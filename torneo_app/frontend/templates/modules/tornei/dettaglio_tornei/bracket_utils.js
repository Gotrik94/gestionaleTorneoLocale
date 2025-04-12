console.info("📦 bracket_utils.js caricato");

// ✅ Recupera nome squadra da ID
function getNomeSquadraById(squadre, id) {
  if (!id) return "BYE";
  const sq = squadre.find(s => s.id === id);
  return sq ? sq.nome : "Sconosciuta";
}

// ✅ Costruisce struttura bracket da fase e partite
function buildBracketDataFromFase(fase) {
  console.log("⚙️ buildBracketDataFromFase per fase ID:", fase.id);

  if (!fase.partite || fase.partite.length === 0) {
    return generaBracketVuoto(fase.squadre);
  }

  const roundMap = new Map();
  fase.partite.forEach(p => {
    const r = p.round_num || 1;
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r).push(p);
  });

  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
  const bracketTeams = [];
  const bracketResults = [];

  sortedRounds.forEach((roundNumber, roundIndex) => {
    const matches = roundMap.get(roundNumber);

    if (roundIndex === 0) {
      matches.forEach(m => {
        const nomeRossa = getNomeSquadraById(fase.squadre, m.squadra_rossa);
        const nomeBlu = getNomeSquadraById(fase.squadre, m.squadra_blu);
        bracketTeams.push([
          { name: nomeRossa, id: m.squadra_rossa || null },
          { name: nomeBlu, id: m.squadra_blu || null }
        ]);
      });
    }

    const punteggiRound = matches.map(m => [
      parseInt(m.punteggio_rossa || 0),
      parseInt(m.punteggio_blu || 0)
    ]);
    bracketResults.push(punteggiRound);
  });

  return { teams: bracketTeams, results: bracketResults };
}

// ✅ Bracket vuoto con slot 2^N
function generaBracketVuoto(squadre) {
  const valid = squadre.filter(s => s.id);
  const nPow2 = Math.pow(2, Math.ceil(Math.log2(valid.length || 2)));

  const teams = [];
  for (let i = 0; i < nPow2; i += 2) {
    teams.push([
      { name: "", id: null },
      { name: "", id: null }
    ]);
  }

  const results = [teams.map(() => [0, 0])];
  return { teams, results };
}

// ✅ Render del bracket con jQuery Bracket
function renderBracket(data, faseId) {
  console.log("📦 renderBracket() → fase:", faseId);
  console.log("📊 teams:", data.teams);
  console.log("📊 results:", data.results);
  console.log("🛠️ isEditable:", window.isBracketEditable);

  const bracketContainer = document.getElementById(`bracket-${faseId}`);
  if (!bracketContainer || !data?.teams || !data?.results) {
    console.warn("⚠️ Bracket container mancante o dati incompleti");
    return;
  }

  const finalTeams = data.teams.map(match => [
    match[0]?.name || "BYE",
    match[1]?.name || "BYE"
  ]);

  $(bracketContainer).empty().bracket({
    init: {
      teams: finalTeams,
      results: data.results
    },
    save: (data, userData) => {
      console.log("✏️ Callback save attivata!", data, userData);
    },
    skipConsolationRound: true,
    disableToolbar: true,
    disableTeamEdit: !window.isBracketEditable,
    centerConnectors: true,
    teamWidth: 180,
    scoreWidth: 50,
    matchMargin: 40,
    roundMargin: 70
  });

  // Drag & Drop custom (se modificabile)
  if (window.isBracketEditable) {
    setTimeout(() => {
      console.log("🖱️ Inizializzo drag & drop per i blocchi .team");

      const teamEls = bracketContainer.querySelectorAll('.team');
      teamEls.forEach(teamEl => {
        if (teamEl.textContent.trim() === "") {
          teamEl.classList.add("empty-slot");
        }

        teamEl.addEventListener('dragover', e => {
          e.preventDefault(); // 🔑 fondamentale
        });

        teamEl.addEventListener('drop', e => {
          e.preventDefault();

          let dataDrop;
          try {
            dataDrop = JSON.parse(e.dataTransfer.getData("application/json"));
          } catch (err) {
            console.error("❌ Errore parsing JSON drag:", err);
            return;
          }

          console.log("✅ DROP ricevuto:", dataDrop);

          teamEl.textContent = dataDrop.nome;
          teamEl.dataset.id = dataDrop.id;
          teamEl.classList.remove("empty-slot");

          // 🧠 Verifica e aggiorna currentBracketData
          if (
            !window.currentBracketData ||
            !Array.isArray(window.currentBracketData.teams)
          ) {
            console.error("❌ currentBracketData.teams non è definito!");
            return;
          }

          const allMatchEls = bracketContainer.querySelectorAll('.match');
          allMatchEls.forEach((matchEl, matchIdx) => {
            const teamNodes = matchEl.querySelectorAll('.team');
            teamNodes.forEach((node, teamIdx) => {
              if (node === teamEl) {
                if (!window.currentBracketData.teams[matchIdx]) {
                  console.warn(`⚠️ Match mancante a ${matchIdx}, lo creo`);
                  window.currentBracketData.teams[matchIdx] = [null, null];
                }

                window.currentBracketData.teams[matchIdx][teamIdx] = {
                  name: dataDrop.nome,
                  id: parseInt(dataDrop.id)
                };

                console.log("🧠 Bracket aggiornato:", window.currentBracketData.teams);
              }
            });
          });
        });
      });
    }, 100);
  }
}


// ✅ Lista draggabile delle squadre
function renderSquadreDisponibili(squadre, containerId) {
  console.log("🧩 renderSquadreDisponibili() →", squadre);
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn("⚠️ Container squadre non trovato:", containerId);
    return;
  }

  container.innerHTML = '';

  if (window.isBracketConfermato) {
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
      console.log("🪝 dragstart →", s.nome);
      e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id, nome: s.nome }));
    });

    container.appendChild(el);
  });
}


// ✅ Cookie reader (es. CSRF)
function getCookie(name) {
  const val = `; ${document.cookie}`;
  const parts = val.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// ✅ Nascondi i bottoni dopo conferma
function nascondiBottoniBracket() {
  document.querySelectorAll('.btn-salvabracket, .btn-resetbracket, .btn-generabracket')
    .forEach(btn => btn.style.display = 'none');
}

// 🔧 Placeholder per logica futura
async function salvaBracket(faseId) {
  try {
    console.log("💾 Salvataggio bracket => faseId:", faseId);

    if (!window.currentBracketData) {
      console.warn("⚠️ Nessun bracket da salvare");
      Swal.fire("Errore", "Nessun bracket da salvare", "error");
      return;
    }

    // Prepara dati
    const bracketToSend = {
      ...window.currentBracketData,
      teams: window.currentBracketData.teams.map(match => match.map(tm => {
        if (!tm || !tm.id) return null;
        return { id: tm.id, name: tm.name };
      }))
    };

    // POST request
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

    window.isBracketConfermato = true;
    window.nascondiBottoniBracket();

    await Swal.fire({
      icon: "success",
      title: "Bracket salvato",
      text: "Il bracket è stato confermato correttamente.",
      timer: 2000,
      showConfirmButton: false
    });

    location.reload();


  } catch (err) {
    console.error("❌ Errore salvataggio bracket:", err);
    Swal.fire("Errore", "Impossibile salvare il bracket", "error");
  }
}

function resetBracket(faseId) {
  console.log(`🔄 resetBracket(${faseId}) - da implementare`);
}

// ✅ Esposizione globale
window.getNomeSquadraById = getNomeSquadraById;
window.buildBracketDataFromFase = buildBracketDataFromFase;
window.generaBracketVuoto = generaBracketVuoto;
window.renderBracket = renderBracket;
window.renderSquadreDisponibili = renderSquadreDisponibili;
window.getCookie = getCookie;
window.nascondiBottoniBracket = nascondiBottoniBracket;
window.salvaBracket = salvaBracket;
window.resetBracket = resetBracket;
