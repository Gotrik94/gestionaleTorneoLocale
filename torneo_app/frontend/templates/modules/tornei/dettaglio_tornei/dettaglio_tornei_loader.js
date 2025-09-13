window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Caricamento dati del torneo avviato");

  const torneoId = document.getElementById("torneo-container")?.dataset.torneoId;
  const tabFasi = document.getElementById("tab-fasi");
  const contenutoFasi = document.getElementById("contenuto-fasi");

  if (!torneoId) return console.error("❌ torneoId non trovato nel DOM");

  try {
    const resp = await fetch(`/api/dettaglio/${torneoId}/dettaglio/`);
    if (!resp.ok) throw new Error("Errore HTTP: " + resp.status);
    const data = await resp.json();

    if (!data.fasi || data.fasi.length === 0) {
      console.warn("⚠️ Nessuna fase trovata");
      return;
    }

    tabFasi.innerHTML = "";
    contenutoFasi.innerHTML = "";

    data.fasi.forEach((fase, idx) => {
      const dataInizio = new Date(fase.data_inizio);
      const oggi = new Date();
      const faseNonIniziata = dataInizio > oggi;

      const li = document.createElement("li");
      li.classList.add("nav-item");
      li.innerHTML = `<button class="nav-link ${idx === 0 ? "active" : ""}" data-bs-toggle="tab" data-bs-target="#fase-${fase.id}">${fase.nome}</button>`;
      tabFasi.appendChild(li);

      const tabPane = document.createElement("div");
      tabPane.className = `tab-pane fade ${idx === 0 ? "show active" : ""}`;
      tabPane.id = `fase-${fase.id}`;

      if (faseNonIniziata) {
        tabPane.innerHTML = `
          <div class="alert alert-warning text-dark p-4 shadow">
            <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
            <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${dataInizio.toLocaleDateString("it-IT")}</strong>.</p>
          </div>`;
      } else {
        tabPane.innerHTML = `
          <div class="row">
            <div class="col-md-3">
              <div class="card bg-dark text-light shadow-sm mb-3">
                <div class="card-header text-warning">Squadre disponibili</div>
                <div class="card-body" id="squadre-disponibili-${fase.id}"></div>
              </div>
            </div>
            <div class="col-md-9">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="text-warning">Bracket: ${fase.nome}</h5>
                <div class="bracket-actions">
                  ${fase.bracket_confermato ? "" : `
                    <button class="btn btn-danger btn-sm btn-resetbracket" data-fase-id="${fase.id}">❌ Reset</button>
                    <button class="btn btn-success btn-sm btn-salvabracket" data-fase-id="${fase.id}">💾 Salva</button>
                    <button class="btn btn-warning btn-sm btn-generabracket" data-fase-id="${fase.id}">🔀 Genera</button>
                  `}
                </div>
              </div>
              <div class="bracket-wrapper position-relative">
                <div id="bracket-loader-${fase.id}" class="loader-container d-none">
                  <div class="loader"></div>
                </div>
                <div id="bracket-${fase.id}"></div>
              </div>
            </div>
          </div>`;
      }

      contenutoFasi.appendChild(tabPane); // ⚠️ Appendere PRIMA del rendering

      if (!faseNonIniziata) {
        const tipologia = (fase.tipologia || "").toUpperCase();
        const isBracketConfermato = !!fase.bracket_confermato;
        const isBracketEditable = !isBracketConfermato;
        let bracketData = null;

        switch (tipologia) {
          case "ELIMINAZIONE_DIRETTA":
            bracketData = isBracketConfermato
              ? window.buildBracketDataFromFase(fase)
              : (fase.partite?.length
                  ? window.buildBracketDataFromFase(fase)
                  : window.generaBracketVuoto(fase.squadre));

            if (isBracketConfermato && bracketData) {
              console.log("🔄 Propago BYE in round successivi (fase confermata)");
              window.propagaVincitoriBye(bracketData);  // ✅ PROPAGAZIONE QUI
            }
            break;

          case "GRUPPI":
            console.warn("⚠️ Tipologia GRUPPI non ancora gestita");
            break;

          default:
            console.warn(`⚠️ Tipologia fase ${fase.tipologia} non supportata al momento`);
            break;
        }

        if (bracketData) {
          window.bracketDataPerFase = window.bracketDataPerFase || {};
          window.bracketDataPerFase[fase.id] = bracketData;

          window.isBracketEditable = isBracketEditable;
          window.isBracketConfermato = isBracketConfermato;

          if (!window.isBracketEditable) {
              console.log("🔄 Propago BYE in round successivi (fase confermata)");
              window.propagaVincitoriBye(bracketData);
          }

          window.renderBracket(bracketData, fase.id);
          window.renderSquadreDisponibili(fase.squadre, `squadre-disponibili-${fase.id}`);
        } else {
          tabPane.innerHTML += `
            <div class="alert alert-warning text-dark mt-3">
              <strong>⚠️ Tipologia di fase non ancora supportata:</strong> ${fase.tipologia}
            </div>`;
        }
      }
    });

    // Eventi globali
    document.querySelectorAll(".btn-generabracket").forEach(btn => {
      btn.addEventListener("click", async () => {
        const faseId = btn.dataset.faseId;
        const fase = data.fasi.find(f => f.id == faseId);
        console.log("🔄 Avvio generazione bracket per fase ID:", faseId, fase);

        const conferma = await Swal.fire({
          title: "Confermi la generazione del bracket?",
          text: "Questa operazione sovrascriverà il bracket esistente.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sì, genera",
          cancelButtonText: "Annulla"
        });

        if (!conferma.isConfirmed) {
          console.log("❌ Generazione annullata");
          return;
        }

        if (!fase || !fase.squadre?.length) {
          console.warn("⚠️ Nessuna squadra trovata per la fase:", fase);
          return Swal.fire("Errore", "Nessuna squadra disponibile", "error");
        }

        const shuffled = [...fase.squadre].sort(() => Math.random() - 0.5);
        console.log("🔀 Squadre mischiate:", shuffled.map(s => s.nome));

        const teams = [];
        while (shuffled.length > 0) {
          const t1 = shuffled.shift() || { id: null, nome: "BYE" };
          const t2 = shuffled.shift() || { id: null, nome: "BYE" };
          teams.push([
            { name: t1.nome, id: t1.id },
            { name: t2.nome, id: t2.id }
          ]);
        }

        // ✅ Completare i team fino alla potenza di 2 (slot = team.length * 2)
        function completaTeamsConBYE(teams) {
          const slotCount = Math.pow(2, Math.ceil(Math.log2(teams.length * 2)));
          const byeTemplate = { name: "BYE", id: null };
          while (teams.length * 2 < slotCount) {
            teams.push([byeTemplate, byeTemplate]);
            console.log("➕ Aggiunto match BYE → totale:", teams.length);
          }
          return teams;
        }

        completaTeamsConBYE(teams);
        console.log("✅ Teams finali:", JSON.stringify(teams, null, 2));

        const resultsPrimoRound = teams.map(([a, b], idx) => {
          const punteggio = (a.id && !b.id) ? [1, 0] : (!a.id && b.id) ? [0, 1] : [0, 0];
          console.log(`🏁 Match ${idx + 1}: ${a.name} vs ${b.name} → ${punteggio}`);
          return punteggio;
        });

        function generaResultsPlaceholder(teams) {
          const totalRounds = Math.ceil(Math.log2(teams.length * 2));
          const results = [];
          for (let r = 0; r < totalRounds; r++) {
            const matchesInRound = Math.pow(2, totalRounds - r - 1);
            const round = Array.from({ length: matchesInRound }, () => [0, 0]);
            results.push(round);
            console.log(`📐 Round ${r + 1}: ${matchesInRound} match`);
          }
          return results;
        }

        const resultsPlaceholder = generaResultsPlaceholder(teams);
        resultsPlaceholder[0] = resultsPrimoRound;

        const bracketData = {
          teams,
          results: resultsPlaceholder
        };

        try {
          window.currentBracketData = bracketData;
          console.log("📦 currentBracketData impostato");
          window.renderBracket(bracketData, faseId);
        } catch (e) {
          console.error("❌ ERRORE durante il rendering del bracket:", e);
        }
      });
    });

    document.querySelectorAll(".btn-resetbracket").forEach(btn =>
      btn.addEventListener("click", () => {
        const faseId = btn.dataset.faseId;
        const fase = data.fasi.find(f => f.id == faseId);
        const bracketData = window.generaBracketVuoto(fase.squadre);
        window.renderBracket(bracketData, faseId);
      })
    );

    document.querySelectorAll(".btn-salvabracket").forEach(btn =>
      btn.addEventListener("click", () => {
        const faseId = btn.dataset.faseId;
        window.salvaBracket(faseId);
      })
    );

  } catch (err) {
    console.error("❌ Errore caricamento dati:", err);
    Swal.fire("Errore", "Impossibile caricare i dati del torneo.", "error");
  }
    // 🔁 Re-render del bracket quando una tab diventa attiva (una volta per fase)
    const renderedFasi = new Set();

    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', e => {
        const tabPane = document.querySelector(e.target.getAttribute('href'));
        const bracketDiv = tabPane?.querySelector('[id^="bracket-"]');

        if (bracketDiv && window.bracketDataPerFase) {
          const faseId = bracketDiv.id.replace("bracket-", "");
          if (renderedFasi.has(faseId)) return;

          const dataFase = window.bracketDataPerFase[faseId];
          if (dataFase) {
            console.log(`🔁 Primo render bracket perché tab attivo (fase ${faseId})`);
            window.renderBracket(dataFase, faseId);
            renderedFasi.add(faseId);
          }
        }
      });
    });
});
