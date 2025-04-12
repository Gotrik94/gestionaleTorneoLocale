window.addEventListener("DOMContentLoaded", async () => {
  const torneoId = document.getElementById("torneo-container")?.dataset.torneoId;
  const tabFasi = document.getElementById("tab-fasi");
  const contenutoFasi = document.getElementById("contenuto-fasi");

  if (!torneoId) return console.error("❌ torneoId non trovato");

  try {
    const resp = await fetch(`/api/dettaglio/${torneoId}/dettaglio/`);
    if (!resp.ok) throw new Error("Errore HTTP: " + resp.status);
    const data = await resp.json();

    let faseAttuale = null;
    let currentBracketData = null;

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
                    <button class="btn btn-danger btn-sm btn-resetbracket">❌ Reset</button>
                    <button class="btn btn-success btn-sm btn-salvabracket">💾 Salva</button>
                    <button class="btn btn-warning btn-sm btn-generabracket">🔀 Genera</button>
                  `}
                </div>
              </div>
              <div class="bracket-wrapper">
                <div id="bracket-${fase.id}"></div>
              </div>
            </div>
          </div>`;
      }

      contenutoFasi.appendChild(tabPane);

        if (idx === 0 && !faseNonIniziata) {
          faseAttuale = fase;

          // ✅ Inizializza il bracket e salvalo come variabile globale
          window.currentBracketData = fase.bracket_confermato
            ? window.buildBracketDataFromFase(fase)
            : (fase.partite?.length
                ? window.buildBracketDataFromFase(fase)
                : window.generaBracketVuoto(fase.squadre));

          window.isBracketConfermato = !!fase.bracket_confermato;
          window.isBracketEditable = !window.isBracketConfermato;

          console.log("🎯 Chiamo renderBracket con dati:", window.currentBracketData);
          console.log("🔓 isBracketConfermato:", window.isBracketConfermato);
          console.log("✏️ isBracketEditable:", window.isBracketEditable);

          window.renderBracket(window.currentBracketData, fase.id);
          window.renderSquadreDisponibili(fase.squadre, `squadre-disponibili-${fase.id}`);
        }
    });

    // Collega i bottoni
    document.querySelectorAll(".btn-salvabracket").forEach(btn =>
      btn.addEventListener("click", () => {
        if (faseAttuale?.id) window.salvaBracket(faseAttuale.id);
      })
    );

    document.querySelectorAll(".btn-resetbracket").forEach(btn =>
      btn.addEventListener("click", () => {
        if (faseAttuale?.id) {
          currentBracketData = window.generaBracketVuoto(faseAttuale.squadre);
          window.renderBracket(currentBracketData, faseAttuale.id);
        }
      })
    );

    document.querySelectorAll(".btn-generabracket").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!faseAttuale || !faseAttuale.squadre.length) {
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

        console.log("🔀 Bracket generato manualmente:", currentBracketData);

        // FIX ⬇️
        window.currentBracketData = currentBracketData;

        window.renderBracket(currentBracketData, faseAttuale.id);
      });
    });


  } catch (err) {
    console.error("❌ Errore caricamento dati:", err);
    Swal.fire("Errore", "Impossibile caricare i dati del torneo.", "error");
  }
});
