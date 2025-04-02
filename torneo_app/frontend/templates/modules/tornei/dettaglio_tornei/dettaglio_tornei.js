document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ DOM Caricato, avvio script...");

  const torneoId = document.getElementById('torneo-container').dataset.torneoId;
  const tabFasi = document.getElementById('tab-fasi');
  const contenutoFasi = document.getElementById('contenuto-fasi');

  let currentBracketData = null;
  let faseAttuale = null;

  async function loadTorneoData() {
    try {
      const response = await fetch(`/api/dettaglio/${torneoId}/dettaglio/`);
      if (!response.ok) throw new Error("Errore caricamento dati");

      const data = await response.json();
      console.log("✅ Dati torneo:", data);

      tabFasi.innerHTML = '';
      contenutoFasi.innerHTML = '';

      data.fasi.forEach((fase, index) => {
        const tab = document.createElement('li');
        tab.classList.add('nav-item');
        tab.innerHTML = `
          <button class="nav-link ${index === 0 ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#fase-${fase.id}">
            ${fase.nome}
          </button>
        `;
        tabFasi.appendChild(tab);

        const oggi = new Date();
        const dataInizioFase = new Date(fase.data_inizio);
        const faseNonIniziata = dataInizioFase > oggi;

        const content = document.createElement('div');
        content.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
        content.id = `fase-${fase.id}`;

        if (faseNonIniziata) {
          content.innerHTML = `
            <div class="alert alert-warning text-dark p-4 shadow">
              <h5 class="mb-2"><span class="text-white">⏳ Fase non ancora iniziata</span></h5>
              <p>La fase <strong>${fase.nome}</strong> inizierà il <strong>${fase.data_inizio}</strong>.</p>
            </div>
          `;
        } else {
          content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="text-warning">Bracket: ${fase.nome}</h5>
                <div class="bracket-actions">
                    <button id="btn-generabracket" class="btn btn-warning btn-sm">
                        <i class="fa fa-random"></i> Genera Bracket
                    </button>
                    <button id="btn-resetbracket" class="btn btn-danger btn-sm">
                        <i class="fa fa-trash"></i> Reset Bracket
                    </button>
                    <button id="btn-salvabracket" class="btn btn-success btn-sm">
                        <i class="fa fa-save"></i> Salva Bracket
                    </button>
                </div>
              </div>
            </div>
            <div class="bracket-wrapper"><div id="bracket-${fase.id}"></div></div>
          `;
        }

        contenutoFasi.appendChild(content);

        // Bracket attuale solo per la prima fase attiva
        if (index === 0 && !faseNonIniziata) {
          faseAttuale = fase;

          if (fase.partite?.length) {
            currentBracketData = getBracketFromPartite(fase);
            console.log("🔁 Bracket da partite:", currentBracketData);
            renderBracket(currentBracketData, fase.id);
          } else {
            currentBracketData = generaBracketPlaceholder(fase.squadre);
            console.log("🔲 Bracket placeholder generato:", currentBracketData);
            renderBracket(currentBracketData, fase.id);
          }
        }
      });

    } catch (err) {
      console.error("❌ Errore caricamento dati:", err);
    }
  }

  function getBracketFromPartite(fase) {
    return {
      teams: fase.partite.map(p => [
        { name: p.squadra_rossa_nome, id: p.squadra_rossa_id },
        { name: p.squadra_blu_nome, id: p.squadra_blu_id }
      ]),
      results: [fase.partite.map(p => [p.punteggio_rossa, p.punteggio_blu])],
      partiteIds: fase.partite.map(p => p.id)
    };
  }

  function generaBracketPlaceholder(squadre) {
    const squadreValid = squadre.filter(s => s.id);
    const num = squadreValid.length;
    if (num < 2) return { teams: [], results: [], partiteIds: [] };

    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(num)));
    const filled = [...squadreValid];

    while (filled.length < nextPow2) {
      filled.push({ id: null, nome: "" });
    }

    const teams = [];
    for (let i = 0; i < filled.length; i += 2) {
      teams.push([
        { name: '', id: filled[i]?.id || null },
        { name: '', id: filled[i + 1]?.id || null }
      ]);
    }

    const results = [teams.map(() => [0, 0])];
    return { teams, results, partiteIds: [] };
  }

    function renderBracket(data, faseId) {
      const bracketContainer = $(`#bracket-${faseId}`);
      bracketContainer.empty().bracket({
        init: {
          teams: data.teams.map(match => [match[0].name || '', match[1].name || '']),
          results: data.results
        },
        disableToolbar: true,
        disableTeamEdit: true,
        save: typeof data.partiteIds !== 'undefined' && data.partiteIds.length > 0
          ? function (matchData, roundIdx, matchIdx) {
              const partitaId = data.partiteIds?.[matchIdx];
              if (!partitaId) return;

              // chiamata API per aggiornamento punteggio
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
                .then(data => console.log("✅ Risultato aggiornato", data))
                .catch(err => console.error("❌ Errore aggiornamento risultato:", err));
            }
          : function () {
              console.log("💾 Bracket placeholder attivo – nessun salvataggio");
            }
      });
    }


  // 🔁 Salva Bracket
  window.generaBracket = async (faseId) => {
    try {
      const response = await fetch(`/api/dettaglio/fase/${faseId}/salva_bracket/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ bracket: currentBracketData })
      });
      const result = await response.json();
      if (!response.ok) throw result;
      console.log("✅ Bracket salvato:", result);
      await loadTorneoData();
    } catch (err) {
      console.error("❌ Errore salvataggio:", err);
    }
  };

  // 🔄 Reset Bracket
  window.resetBracket = async (faseId) => {
    const fase = faseAttuale;
    if (!fase) return;
    currentBracketData = generaBracketPlaceholder(fase.squadre);
    renderBracket(currentBracketData, fase.id);
    console.log("🔃 Bracket resettato");
  };

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  loadTorneoData();
});
