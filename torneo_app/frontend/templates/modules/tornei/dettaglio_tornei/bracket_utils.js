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
  console.log("📥 Squadre ricevute:", fase.squadre?.length || 0);
  console.log("📥 Partite ricevute:", fase.partite?.length || 0);

  if (!fase.partite || fase.partite.length === 0) {
    return generaBracketVuoto(fase.squadre);
  }

  const roundMap = new Map();

  console.log("📄 Lista partite:");
  fase.partite.forEach(p => {
    const r = parseInt(p.round_num || 1);
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r).push(p);
    console.log(`  🧩 ID=${p.id} | Round=${r} | ${p.squadra_rossa} vs ${p.squadra_blu} | Vincitore=${p.vincitore} | Punteggio=${p.punteggio_rossa}-${p.punteggio_blu}`);
  });

  console.log("📦 roundMap costruito:");
  for (const [r, matchList] of roundMap.entries()) {
    console.log(`  ↪️ Round ${r}: ${matchList.length} partite`);
  }

  const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
  const bracketTeams = [];
  const bracketResults = [];

  sortedRounds.forEach((roundNumber, roundIndex) => {
    const matches = roundMap.get(roundNumber);
    console.log(`📦 Round ${roundNumber} (index ${roundIndex}) → ${matches.length} match totali`);

    if (roundIndex === 0) {
      matches.forEach(m => {
        const nomeRossa = getNomeSquadraById(fase.squadre, m.squadra_rossa);
        const nomeBlu = getNomeSquadraById(fase.squadre, m.squadra_blu);
        console.log(`👥 Match iniziale → ${nomeRossa} vs ${nomeBlu}`);
        bracketTeams.push([
          { name: nomeRossa || "TBD", id: m.squadra_rossa || null },
          { name: nomeBlu || "TBD", id: m.squadra_blu || null }
        ]);
      });
    }

    const punteggiRound = matches.map(m => {
      const pr = parseInt(m.punteggio_rossa || 0);
      const pb = parseInt(m.punteggio_blu || 0);

      if (pr === 0 && pb === 0 && m.vincitore) {
        if (m.vincitore === m.squadra_rossa) return [1, 0];
        if (m.vincitore === m.squadra_blu) return [0, 1];
      }

      console.log(`🧮 Punteggio → Match ID=${m.id} | ${m.squadra_rossa} vs ${m.squadra_blu} | Score: ${pr},${pb}`);
      return [pr, pb];
    });

    bracketResults.push(punteggiRound);
  });

  const slotCount = Math.pow(2, Math.ceil(Math.log2(bracketTeams.length * 2)));
  const byeTemplate = { name: "BYE", id: null };
  while (bracketTeams.length * 2 < slotCount) {
    bracketTeams.push([byeTemplate, byeTemplate]);
    if (bracketResults.length === 0) bracketResults.push([]);
    bracketResults[0].push([0, 0]);
    console.log("➕ Aggiunto match BYE → totale teams:", bracketTeams.length);
  }

  const totalRounds = Math.ceil(Math.log2(bracketTeams.length * 2));
  while (bracketResults.length < totalRounds) {
    const emptyMatches = Math.pow(2, totalRounds - bracketResults.length - 1);
    const round = Array.from({ length: emptyMatches }, () => [0, 0]);
    bracketResults.push(round);
    console.log(`📐 Aggiunto round vuoto (${emptyMatches} match)`);
  }

  const bracketData = { teams: bracketTeams, results: bracketResults };
  console.log("📦 buildBracketDataFromFase → risultato:", bracketData);
  return bracketData;
}

function getNomeSquadraById(lista, id) {
  return lista.find(s => s.id === id)?.nome || "BYE";
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

function isTeamBye(team) {
  return (
    team == null ||
    (typeof team === "object" && (team.name === "BYE" || team.id === null))
  );
}

function propagaVincitoriBye(bracketData) {
  console.log("⚙️ Inizio propagazione vincitori BYE");

  const { results, teams } = bracketData;

  if (!Array.isArray(results) || !Array.isArray(teams)) {
    console.error("❌ Struttura dati bracket non valida:", { results, teams });
    return;
  }

  // Prepara il primo round
  let currentTeams = teams.slice(0);

  for (let r = 1; r < results.length; r++) {
    const prevResults = results[r - 1];
    const round = results[r];
    const nextTeams = [];

    console.groupCollapsed(`📦 Round ${r + 1}:`);

    for (let i = 0; i < round.length; i++) {
      const idx1 = i * 2;
      const idx2 = idx1 + 1;

      const match1 = prevResults[idx1] || [0, 0];
      const match2 = prevResults[idx2] || [0, 0];

      const matchTeam1 = currentTeams[idx1] || [null, null];
      const matchTeam2 = currentTeams[idx2] || [null, null];

      let team1 = null;
      if (match1[0] > match1[1]) team1 = matchTeam1[0];
      else if (match1[1] > match1[0]) team1 = matchTeam1[1];

      let team2 = null;
      if (match2[0] > match2[1]) team2 = matchTeam2[0];
      else if (match2[1] > match2[0]) team2 = matchTeam2[1];

      const name1 = team1?.name || "???";
      const name2 = team2?.name || "???";

      console.log(`🔍 Match ${i + 1} ➜ ${name1} vs ${name2}`);

      let result = [0, 0];

      if (!team1 && !team2) {
        console.warn(`⚠️ Entrambi i team sono null: BYE vs BYE`);
        result = [1, 0];
        team1 = { name: "BYE", id: null };
        team2 = { name: "BYE", id: null };
        console.log("📌 Assegno vittoria a team1 (BYE) → [1, 0]");
      } else if (!team1 && team2) {
        result = [0, 1];
        console.log(`✅ ${name2} avanza contro BYE`);
      } else if (team1 && !team2) {
        result = [1, 0];
        console.log(`✅ ${name1} avanza contro BYE`);
      } else {
        const played = (match1[0] !== 0 || match1[1] !== 0) && (match2[0] !== 0 || match2[1] !== 0);
        if (played) {
          console.log(`❓ Match aperto tra ${name1} e ${name2}`);
        } else {
          console.log(`⏳ In attesa di esito precedente`);
        }
        result = [0, 0];
      }

      round[i] = result;

      // 🔁 PATCH: aggiorna la lista dei team in modo coerente
      nextTeams.push([
        team1 || { name: "TBD", id: null },
        team2 || { name: "TBD", id: null }
      ]);
    }

    // 🧠 aggiorna i team per il round successivo
    currentTeams = nextTeams;
    console.groupEnd();
  }

  console.log("✅ Propagazione completata");
}


function aggiornaVincitoriBye(bracketData) {
  console.log('🔄 Inizio aggiornaVincitoriBye');
  const { teams, results } = bracketData;

  if (!Array.isArray(teams) || !Array.isArray(results)) {
    console.error('❌ Dati bracket non validi', bracketData);
    return;
  }

  for (let round = 1; round < results.length; round++) {
    const prev = results[round - 1];
    const curr = results[round];
    console.groupCollapsed(`📦 Round ${round + 1}`);

    // teams che avanzano da questo round
    const nextTeams = [];

    for (let matchIdx = 0; matchIdx < curr.length; matchIdx++) {
      const idx1 = matchIdx * 2;
      const idx2 = idx1 + 1;

      const score1 = prev[idx1] || [0, 0];
      const score2 = prev[idx2] || [0, 0];
      const teamA = teams[idx1]   || { name: null, id: null };
      const teamB = teams[idx2]   || { name: null, id: null };

      const byeA = isTeamBye(teamA);
      const byeB = isTeamBye(teamB);

      console.log(`🔍 Match ${matchIdx + 1}: ${teamA.name} [${score1}] vs ${teamB.name} [${score2}]`);

      let result;
      if (byeA && !byeB) {
        result = [0, 1];
        console.log(`✅ ${teamB.name} avanza (BYE avversario)`);
      } else if (!byeA && byeB) {
        result = [1, 0];
        console.log(`✅ ${teamA.name} avanza (BYE avversario)`);
      } else {
        // nessun BYE: mantieni com’era
        result = curr[matchIdx];
        console.log('↔️ Match regolare, risultato mantenuto:', result);
      }

      // Aggiorna risultato e teams per round successivo
      curr[matchIdx] = result;
      nextTeams[matchIdx] = result[0] > result[1] ? teamA : teamB;
    }

    // Sostituisci la lista teams del round successivo (solo se serve)
    if (teams.length > curr.length * 2) {
      // le teams originali restano per round 1
    } else {
      teams.splice(0, nextTeams.length, ...nextTeams);
    }

    console.groupEnd();
  }

  console.log('✅ aggiornaVincitoriBye completato', { teams, results });
}




// 🔍 Funzione helper: restituisce 1 se team1 vince, 2 se team2 vince, null se non chiaro
function calcolaVincitore(team1, team2) {
  if (!team1 && !team2) return null;
  if (!team1) return 2;
  if (!team2) return 1;

  const [s1, s2] = team1;
  const [s3, s4] = team2;

  const t1Valid = s1 !== undefined && s2 !== undefined;
  const t2Valid = s3 !== undefined && s4 !== undefined;

  const t1Wins = t1Valid && s1 > s2;
  const t2Wins = t2Valid && s3 > s4;

  if (t1Wins && !t2Wins) return 1;
  if (t2Wins && !t1Wins) return 2;

  return null;
}




// ✅ Render del bracket con jQuery Bracket
function renderBracket(data, faseId, retry = 0) {
  console.log("📦 renderBracket() → fase:", faseId);

  const bracketContainer = document.getElementById(`bracket-${faseId}`);
  const loader = document.getElementById(`bracket-loader-${faseId}`);

  if (loader) loader.classList.remove("d-none");

  const datiValidi = Array.isArray(data?.teams) && Array.isArray(data?.results);
  const visibile = bracketContainer?.offsetWidth > 0 && bracketContainer?.offsetHeight > 0;

  if (!bracketContainer || !datiValidi) {
    if (retry < 10) {
      console.warn(`⏳ Dati non pronti o container mancante, ritento (${retry + 1})...`);
      return setTimeout(() => renderBracket(data, faseId, retry + 1), 150);
    } else {
      if (loader) loader.classList.add("d-none");
      return console.error("❌ Dati ancora non pronti dopo vari tentativi");
    }
  }

  if (!visibile) {
    console.warn(`👁️ Container non visibile, attendo... (${retry + 1})`);
    if (retry < 10) {
      return setTimeout(() => renderBracket(data, faseId, retry + 1), 400);
    } else {
      if (loader) loader.classList.add("d-none");
      return console.error("❌ Container non visibile dopo vari tentativi");
    }
  }

  // ✅ Corregge problemi strutturali noti
  if (!correggiBracketData(data)) {
    console.error("❌ Bracket data invalido, rendering annullato");
    if (loader) loader.classList.add("d-none");
    return;
  }

  console.log("📊 teams:", data.teams);
  console.log("📊 results:", data.results);
  console.log("🛠️ isEditable:", window.isBracketEditable);

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

  if (loader) loader.classList.add("d-none");

  if (window.isBracketEditable) {
    setTimeout(() => {
      console.log("🖱️ Inizializzo drag & drop per i blocchi .team");

      const teamEls = bracketContainer.querySelectorAll('.team');
      teamEls.forEach(teamEl => {
        if (teamEl.textContent.trim() === "") {
          teamEl.classList.add("empty-slot");
        }

        teamEl.addEventListener('dragover', e => e.preventDefault());

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

          if (!window.currentBracketData || !Array.isArray(window.currentBracketData.teams)) {
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

function correggiBracketData(data) {
  if (!Array.isArray(data?.teams) || !Array.isArray(data?.results)) {
    console.error("❌ Bracket structure is invalid");
    return false;
  }

  const matchCount = data.results[0]?.length || 0;
  const teamCount = data.teams.length;

  // 🔁 Taglio se ci sono più teams del necessario
  if (teamCount > matchCount) {
    console.warn(`⚠️ Troppi team: ${teamCount} > ${matchCount}, taglio`);
    data.teams = data.teams.slice(0, matchCount);
  }

  // 🔁 Pulizia dei punteggi errati nel primo round
  data.results[0] = data.results[0].map(r =>
    Array.isArray(r) && r.length === 2 ? r.map(n => parseInt(n) || 0) : [0, 0]
  );

  for (let r = 1; r < data.results.length; r++) {
    data.results[r] = data.results[r].map(m =>
      Array.isArray(m) && m.length === 2 ? m.map(n => parseInt(n) || 0) : [0, 0]
    );
  }

  // 🔧 Normalizzazione struttura rounds
  const totalRounds = Math.ceil(Math.log2(data.teams.length * 2));

  while (data.results.length < totalRounds) {
    const missingMatches = Math.pow(2, totalRounds - data.results.length - 1);
    data.results.push(Array.from({ length: missingMatches }, () => [0, 0]));
    console.warn(`➕ Round vuoto aggiunto (${missingMatches} match)`);
  }

  data.results.forEach((round, rIdx) => {
    const expected = Math.pow(2, totalRounds - rIdx - 1);
    while (round.length < expected) {
      round.push([0, 0]);
      console.warn(`⚠️ Match mancante in round ${rIdx + 1}, aggiunto [0,0]`);
    }
  });

  const expectedTeams = Math.pow(2, totalRounds) / 2;
  if (data.teams.length < expectedTeams) {
    const bye = { name: "BYE", id: null };
    while (data.teams.length < expectedTeams) {
      data.teams.push([bye, bye]);
      console.warn("➕ Match BYE aggiunto nei team");
    }
  } else if (data.teams.length > expectedTeams) {
    data.teams = data.teams.slice(0, expectedTeams);
    console.warn("✂️ Teams tagliati per eccesso");
  }

  console.log("✅ Bracket normalizzato e pronto");
  return true;
}

function initBracketForFase(fase, faseId) {
  console.log("🚀 Inizializzo bracket per fase:", fase.nome, `(ID: ${faseId})`);

  if (!fase || !fase.partite || !fase.squadre) {
    console.error("❌ Fase non valida:", fase);
    return;
  }

  // 1️⃣ Costruzione base
  const bracketData = buildBracketDataFromFase(fase);
  if (!bracketData) {
    console.error("❌ Errore durante buildBracketDataFromFase");
    return;
  }

  // 2️⃣ Propagazione BYE
  propagaVincitoriBye(bracketData);

  // 3️⃣ Normalizzazione struttura
  const ok = correggiBracketData(bracketData);
  if (!ok) {
    console.error("❌ Bracket non valido dopo normalizzazione");
    return;
  }

  // 4️⃣ Salva globale
  window.currentBracketData = bracketData;

  // 5️⃣ Rendering finale
  renderBracket(bracketData, faseId);
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
window.aggiornaVincitoriBye = aggiornaVincitoriBye;
window.propagaVincitoriBye = propagaVincitoriBye;
