document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Caricato, avvio script mock...");

  const fasi = [
    { id: 1, nome: "Quarti di Finale", tipologia: "ELIMINAZIONE_DIRETTA" },
    { id: 2, nome: "Semifinale", tipologia: "GRUPPI" }
  ];

  const mockBracketData = {
    teams: [
      ["DragonFury", "Memento"],
      ["Roma ASD", "Clown"]
    ],
    results: [
      [
        [1, 0],
        [0, 1]
      ],
      [
        [0, 1]
      ]
    ]
  };

  // Inizializza subito se bracket-1 è già presente
  const bracket1 = document.getElementById("bracket-1");
  if (bracket1) {
    $(bracket1).bracket({
      init: mockBracketData,
      save: function (data, userData) {
        console.log("💾 Salvataggio (mock) bracket-1", data);
      }
    });
    bracket1.dataset.bracketInit = "true";
  }

  // Auto-inizializzazione su cambio tab
  const tabTriggerEls = document.querySelectorAll('#tab-fasi button[data-bs-toggle="tab"]');
  tabTriggerEls.forEach(tabEl => {
    tabEl.addEventListener('shown.bs.tab', (event) => {
      const faseId = event.target.dataset.bsTarget.replace('#fase-', '');
      const container = document.querySelector(`#bracket-${faseId}`);

      if (container && !container.dataset.bracketInit) {
        console.log(`📦 Inizializzo bracket per fase ${faseId}`);

        $(container).bracket({
          init: mockBracketData,
          save: function (data, userData) {
            console.log(`💾 Bracket aggiornato per fase ${faseId}`, data, userData);
          }
        });

        container.dataset.bracketInit = 'true';
      }
    });
  });
});
