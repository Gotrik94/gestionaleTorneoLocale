document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM Caricato, avvio script...");

    // 1) Inizializza i tooltip di Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // 2) Grafico KDA globale (kills, deaths, assists)
    const kdaChartElem = document.getElementById('kdaChart');
    if (kdaChartElem) {
        try {
            const ctx = kdaChartElem.getContext('2d');
            const chartData = JSON.parse(kdaChartElem.dataset.chartData);

            // Stile canvas
            ctx.canvas.style.backgroundColor = '#333';
            ctx.canvas.style.borderRadius = '8px';
            ctx.canvas.style.padding = '10px';
            ctx.canvas.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Kills', 'Deaths', 'Assists'],
                    datasets: [{
                        label: 'Statistiche Totali',
                        data: chartData,
                        backgroundColor: ['#28a745','#dc3545','#17a2b8'],
                        borderColor: ['#218838','#c82333','#138496'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: '#fff' }
                        },
                        title: {
                            display: true,
                            text: 'Statistiche KDA',
                            color: '#fff'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#fff' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            ticks: { color: '#fff' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    },
                    animation: { duration: 1000, easing: 'easeInOutQuad' }
                }
            });
        } catch (err) {
            console.error("❌ Errore nel rendering del grafico KDA globale:", err);
        }
    }

    // 3) Click sulle immagini campione -> apre modale
    const championImages = document.querySelectorAll('.champion-img');
    console.log(`Trovate ${championImages.length} immagini di campioni.`);

    championImages.forEach(img => {
        img.addEventListener("click", function () {
            console.log("Click su un'immagine di campione.");
            const champName = this.dataset.name;
            const champImage = this.dataset.image;
            const champPercentage = this.dataset.percentage;

            console.log(`Dati campione: Nome=${champName}, Image=${champImage}, %=${champPercentage}`);

            const championModalElement = document.getElementById('championModal');
            if (!championModalElement) {
                console.error("Errore: Modale 'championModal' non trovata nel DOM.");
                return;
            }

            const championNameElement = document.getElementById('championName');
            const championImageElement = document.getElementById('championImage');
            const championPickPercentageElement = document.getElementById('championPickPercentage');

            if (!championNameElement || !championImageElement || !championPickPercentageElement) {
                console.error("Errore: Elementi interni della modale non trovati.");
                return;
            }

            championNameElement.innerText = champName;
            championImageElement.src = champImage;
            championPickPercentageElement.innerText = `Percentuale di utilizzo: ${champPercentage}%`;

            const championModal = new bootstrap.Modal(championModalElement);
            championModal.show();
        });
    });

    console.log("✅ Script completato con successo!");

    // 4) Grafico “Andamento delle Prestazioni” globale (performanceChart)
    const perfChartElem = document.getElementById("performanceChart");
    if (perfChartElem) {
        try {
            const ctxPerf = perfChartElem.getContext("2d");
            const kdaRaw = perfChartElem.dataset.kda;
            const vittorieRaw = perfChartElem.dataset.vittorie;
            const obiettiviRaw = perfChartElem.dataset.obiettivi;
            const dateLabelsRaw = perfChartElem.dataset.labels;

            const kdaData = JSON.parse(kdaRaw);
            const vittorieData = JSON.parse(vittorieRaw);
            const obiettiviData = JSON.parse(obiettiviRaw);
            const dateLabels = JSON.parse(dateLabelsRaw);

            new Chart(ctxPerf, {
                type: "line",
                data: {
                    labels: dateLabels,
                    datasets: [
                        {
                            label: "KDA Medio",
                            data: kdaData,
                            borderColor: "#28a745",
                            backgroundColor: "rgba(40, 167, 69, 0.2)",
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: "Vittorie (1=V, -1=S, 0=P)",
                            data: vittorieData,
                            borderColor: "#ffc107",
                            backgroundColor: "rgba(255, 193, 7, 0.2)",
                            tension: 0.3,
                            fill: true,
                        },
                        {
                            label: "Obiettivi Presi",
                            data: obiettiviData,
                            borderColor: "#17a2b8",
                            backgroundColor: "rgba(23,162,184,0.2)",
                            tension: 0.3,
                            fill: true,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { labels: { color: "#fff" } },
                        title: { display: true, text: "Andamento delle Prestazioni", color: "#fff" },
                    },
                    scales: {
                        x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                        y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                    }
                },
            });
        } catch (error) {
            console.error("❌ Errore nel rendering del grafico delle Prestazioni globali:", error);
        }
    }

    // 5) Grafico MVP globale (mvpChart)
    const mvpChartElem = document.getElementById("mvpChart");
    if (mvpChartElem) {
        try {
            const ctxMVP = mvpChartElem.getContext("2d");
            const mvpRawData = mvpChartElem.dataset.giocatori;
            const mvpData = JSON.parse(mvpRawData);

            // Estraggo i nomi e i valori
            const mvpLabels = mvpData.map(item => item[0]); // Nomi giocatori
            const mvpValues = mvpData.map(item => item[1]); // Numero MVP

            new Chart(ctxMVP, {
                type: "bar",
                data: {
                    labels: mvpLabels,
                    datasets: [{
                        label: "MVP Totali",
                        data: mvpValues,
                        backgroundColor: "rgba(255, 193, 7, 0.6)",
                        borderColor: "#ffc107",
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: "MVP Totali per Giocatore",
                            color: "#fff"
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: "#fff" },
                            grid: { color: "rgba(255,255,255,0.1)" }
                        },
                        y: {
                            ticks: { color: "#fff" },
                            grid: { color: "rgba(255,255,255,0.1)" },
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error("❌ Errore nel rendering del grafico MVP:", error);
        }
    }

    // 6) Grafici “Obiettivi” e “Prestazioni” per singolo torneo (nell’accordion)
    const graficiObiettiviRenderizzati = {};
    const graficiPrestazioniRenderizzati = {};

    document.querySelectorAll('.accordion-collapse').forEach(container => {
        container.addEventListener('shown.bs.collapse', () => {

            // A) Grafico obiettivi
            const objCanvas = container.querySelector('canvas[id^="grafico-obiettivi-"]');
            if (objCanvas) {
                const torneoId = objCanvas.id.replace("grafico-obiettivi-", "");
                if (!graficiObiettiviRenderizzati[torneoId]) {
                    try {
                        const ctxObj = objCanvas.getContext("2d");

                        const labels = JSON.parse(objCanvas.dataset.labels || "[]");
                        const torri = JSON.parse(objCanvas.dataset.torri || "[]");
                        const draghi = JSON.parse(objCanvas.dataset.draghi || "[]");
                        const baroni = JSON.parse(objCanvas.dataset.baroni || "[]");
                        const araldi = JSON.parse(objCanvas.dataset.araldi || "[]");
                        const anziani = JSON.parse(objCanvas.dataset.anziani || "[]");
                        const atakhan = JSON.parse(objCanvas.dataset.atakhan || "[]");

                        new Chart(ctxObj, {
                            type: "line",
                            data: {
                                labels: labels,
                                datasets: [
                                    { label: "Torri", data: torri, borderColor: "#ffca28", borderWidth: 2 },
                                    { label: "Draghi", data: draghi, borderColor: "#66bb6a", borderWidth: 2 },
                                    { label: "Anziani", data: anziani, borderColor: "#ffa726", borderWidth: 2 },
                                    { label: "Baroni", data: baroni, borderColor: "#ab47bc", borderWidth: 2 },
                                    { label: "Araldi", data: araldi, borderColor: "#26c6da", borderWidth: 2 },
                                    { label: "Atakhan", data: atakhan, borderColor: "#e53935", borderWidth: 2 }
                                ]
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: { labels: { color: "#fff" } }
                                },
                                scales: {
                                    x: { ticks: { color: "#ccc" }, grid: { color: "rgba(255,255,255,0.1)" } },
                                    y: { ticks: { color: "#ccc" }, grid: { color: "rgba(255,255,255,0.1)" } }
                                }
                            }
                        });

                        graficiObiettiviRenderizzati[torneoId] = true;
                    } catch(e) {
                        console.error("❌ Errore nel rendering del grafico Obiettivi Torneo:", e);
                    }
                }
            }

            // B) Grafico prestazioni (KDA, Vittorie, Obiettivi) per singolo torneo
            const perfCanvas = container.querySelector('canvas[id^="prestazioni-torneo-"]');
            if (perfCanvas) {
                const torneoId = perfCanvas.id.replace("prestazioni-torneo-", "");
                if (!graficiPrestazioniRenderizzati[torneoId]) {
                    try {
                        const ctxPerfTorneo = perfCanvas.getContext('2d');
                        const kdaRaw = perfCanvas.dataset.kda || "[]";
                        const vittorieRaw = perfCanvas.dataset.vittorie || "[]";
                        const obiettiviRaw = perfCanvas.dataset.obiettivi || "[]";
                        const dateLabelsRaw = perfCanvas.dataset.labels || "[]";

                        const kdaData = JSON.parse(kdaRaw);
                        const vittorieData = JSON.parse(vittorieRaw);
                        const obiettiviData = JSON.parse(obiettiviRaw);
                        const dateLabels = JSON.parse(dateLabelsRaw);

                        new Chart(ctxPerfTorneo, {
                            type: "line",
                            data: {
                                labels: dateLabels,
                                datasets: [
                                    {
                                        label: "KDA Medio",
                                        data: kdaData,
                                        borderColor: "#28a745",
                                        backgroundColor: "rgba(40, 167, 69, 0.2)",
                                        tension: 0.3,
                                        fill: true,
                                    },
                                    {
                                        label: "Vittorie (1=V, 0=P, -1=S)",
                                        data: vittorieData,
                                        borderColor: "#ffc107",
                                        backgroundColor: "rgba(255, 193, 7, 0.2)",
                                        tension: 0.3,
                                        fill: true,
                                    },
                                    {
                                        label: "Obiettivi Presi",
                                        data: obiettiviData,
                                        borderColor: "#17a2b8",
                                        backgroundColor: "rgba(23,162,184,0.2)",
                                        tension: 0.3,
                                        fill: true,
                                    },
                                ],
                            },
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: { labels: { color: "#fff" } },
                                    title: {
                                        display: true,
                                        text: "Andamento Prestazioni (Torneo)",
                                        color: "#fff"
                                    },
                                },
                                scales: {
                                    x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                                    y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
                                }
                            }
                        });

                        graficiPrestazioniRenderizzati[torneoId] = true;

                    } catch (e) {
                        console.error("❌ Errore nel rendering del grafico Prestazioni Torneo:", e);
                    }
                }
            }

        }); // fine eventListener shown.bs.collapse
    }); // fine forEach .accordion-collapse

      document.querySelectorAll('canvas[id^="statsDonut-"]').forEach(canvas => {
    // Estraiamo l'ID del torneo (se serve)
    const torneoId = canvas.id.replace("statsDonut-", "");

    // Leggiamo i data-* attributi
    const vittorie = parseInt(canvas.dataset.vittorie || "0", 10);
    const pareggi = parseInt(canvas.dataset.pareggi || "0", 10);
    const sconfitte = parseInt(canvas.dataset.sconfitte || "0", 10);

    // Creiamo il grafico con Chart.js (tipo "doughnut")
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ["Vittorie", "Pareggi", "Sconfitte"],
        datasets: [{
          data: [vittorie, pareggi, sconfitte],
          backgroundColor: ["#28a745", "#ffc107", "#dc3545"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'left',   // <-- la legenda sarà a sinistra
            labels: {
              color: '#fff'
            }
          },
          title: {
            display: true,
            text: "Distribuzione Risultati",
            color: '#fff'
          }
        }
      }
    });
  });

    document.querySelectorAll('canvas[id^="graficoGoldDamage-"]').forEach(canvas => {
      try {
        const id = canvas.id.split('-')[1];
        let statsRossa = {};
        let statsBlu = {};

        try {
          statsRossa = JSON.parse(canvas.dataset.rossa);
        } catch (e) {
          console.error("❌ Errore nel parsing data-rossa (GoldDamage):", canvas.dataset.rossa, e);
        }
        try {
          statsBlu = JSON.parse(canvas.dataset.blu);
        } catch (e) {
          console.error("❌ Errore nel parsing data-blu (GoldDamage):", canvas.dataset.blu, e);
        }

        const nomeRossa = canvas.dataset.nomeRossa || "Team Rossa";
        const nomeBlu = canvas.dataset.nomeBlu || "Team Blu";
        const ctx = canvas.getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Gold", "Damage"],
            datasets: [
              {
                label: nomeRossa,
                data: [statsRossa.gold, statsRossa.danno],
                backgroundColor: "rgba(255,99,132,0.6)",
                borderColor: "rgba(255,99,132,1)",
                borderWidth: 1
              },
              {
                label: nomeBlu,
                data: [statsBlu.gold, statsBlu.danno],
                backgroundColor: "rgba(54,162,235,0.6)",
                borderColor: "rgba(54,162,235,1)",
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { labels: { color: "#fff" } },
              title: {
                display: true,
                text: `Gold e Danni: ${nomeRossa} vs ${nomeBlu}`,
                color: "#fff"
              }
            },
            scales: {
              x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
              y: { beginAtZero: true, ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
            }
          }
        });
      } catch (e) {
        console.error("❌ Errore nel rendering del grafico Gold & Damage:", e);
      }
    });
    document.querySelectorAll('canvas[id^="graficoObiettivi-"]').forEach(canvas => {
      try {
        const statsRossa = JSON.parse(canvas.dataset.rossa);
        const statsBlu = JSON.parse(canvas.dataset.blu);
        const nomeRossa = canvas.dataset.nomeRossa || "Rossa";
        const nomeBlu = canvas.dataset.nomeBlu || "Blu";
        const ctx = canvas.getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Towers", "Drakes", "Elder", "Barons"],
            datasets: [
              {
                label: nomeRossa,
                data: [statsRossa.torri, statsRossa.draghi, statsRossa.anziani, statsRossa.baroni],
                backgroundColor: "rgba(255,99,132,0.6)",
                borderColor: "rgba(255,99,132,1)",
                borderWidth: 1
              },
              {
                label: nomeBlu,
                data: [statsBlu.torri, statsBlu.draghi, statsBlu.anziani, statsBlu.baroni],
                backgroundColor: "rgba(54,162,235,0.6)",
                borderColor: "rgba(54,162,235,1)",
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Obiettivi: ${nomeRossa} vs ${nomeBlu}`,
                color: "#fff"
              },
              legend: { labels: { color: "#fff" } }
            },
            scales: {
              x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
              y: { beginAtZero: true, ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
            }
          }
        });
      } catch (e) {
        console.error("❌ Errore rendering grafico Obiettivi:", e);
      }
    });
    document.querySelectorAll('canvas[id^="graficoKDA-"]').forEach(canvas => {
      try {
        const statsRossa = JSON.parse(canvas.dataset.rossa);
        const statsBlu = JSON.parse(canvas.dataset.blu);
        const nomeRossa = canvas.dataset.nomeRossa || "Rossa";
        const nomeBlu = canvas.dataset.nomeBlu || "Blu";
        const ctx = canvas.getContext("2d");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Kills", "Deaths", "Assists"],
            datasets: [
              {
                label: nomeRossa,
                data: [statsRossa.kills, statsRossa.deaths, statsRossa.assists],
                backgroundColor: "rgba(255,99,132,0.6)",
                borderColor: "rgba(255,99,132,1)",
                borderWidth: 1
              },
              {
                label: nomeBlu,
                data: [statsBlu.kills, statsBlu.deaths, statsBlu.assists],
                backgroundColor: "rgba(54,162,235,0.6)",
                borderColor: "rgba(54,162,235,1)",
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `KDA: ${nomeRossa} vs ${nomeBlu}`,
                color: "#fff"
              },
              legend: { labels: { color: "#fff" } }
            },
            scales: {
              x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
              y: { beginAtZero: true, ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
            }
          }
        });
      } catch (e) {
        console.error("❌ Errore rendering grafico KDA:", e);
      }
    });

    document.querySelectorAll('canvas[id^="graficoVisione-"]').forEach(canvas => {
      try {
        const ctx = canvas.getContext("2d");
        const statsRossa = JSON.parse(canvas.dataset.rossa);
        const statsBlu = JSON.parse(canvas.dataset.blu);
        const nomeRossa = canvas.dataset.nomeRossa || "Team Rossa";
        const nomeBlu = canvas.dataset.nomeBlu || "Team Blu";

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Vision Score", "Wards Placed", "Wards Destroyed"],
            datasets: [
              {
                label: nomeRossa,
                data: [
                  statsRossa.vision_score || 0,
                  statsRossa.ward_placed || 0,
                  statsRossa.ward_destroyed || 0
                ],
                backgroundColor: "rgba(255,99,132,0.6)",
                borderColor: "rgba(255,99,132,1)",
                borderWidth: 1
              },
              {
                label: nomeBlu,
                data: [
                  statsBlu.vision_score || 0,
                  statsBlu.ward_placed || 0,
                  statsBlu.ward_destroyed || 0
                ],
                backgroundColor: "rgba(54,162,235,0.6)",
                borderColor: "rgba(54,162,235,1)",
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: `Visione: ${nomeRossa} vs ${nomeBlu}`,
                color: "#fff"
              },
              legend: { labels: { color: "#fff" } }
            },
            scales: {
              x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
              y: { beginAtZero: true, ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } }
            }
          }
        });
      } catch (e) {
        console.error("❌ Errore rendering grafico Visione:", e);
      }
    });

});
