document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM Caricato, avvio script...");

    // Inizializza i tooltip di Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Grafico delle statistiche
    const ctx = document.getElementById('kdaChart')?.getContext('2d');
    if (ctx) {
        const chartData = JSON.parse(document.getElementById('kdaChart').dataset.chartData);

        // Imposta lo sfondo del canvas
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
                    backgroundColor: [
                        '#28a745', // kills
                        '#dc3545', // deaths
                        '#17a2b8', // assists
                    ],
                    borderColor: [
                        '#218838', // kills
                        '#c82333', // deaths
                        '#138496', // assists
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
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
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: { color: '#fff' },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuad'
                }
            }
        });
    }

    // Evento per mostrare la modale al click
    const championImages = document.querySelectorAll('.champion-img');
    console.log(`Trovate ${championImages.length} immagini di campioni.`);

    championImages.forEach(img => {
        // Aggiungi un listener per il click
        img.addEventListener("click", function () {
            console.log("Click su un'immagine di campione.");

            // Recupera i dati dal dataset dell'immagine
            const champName = this.dataset.name;
            const champImage = this.dataset.image;
            const champPercentage = this.dataset.percentage;

            console.log(`Dati del campione: Nome = ${champName}, Immagine = ${champImage}, Percentuale = ${champPercentage}`);

            // Verifica se la modale esiste nel DOM
            const championModalElement = document.getElementById('championModal');
            if (!championModalElement) {
                console.error("Errore: La modale non è stata trovata nel DOM.");
                return;
            }

            // Verifica se gli elementi della modale esistono
            const championNameElement = document.getElementById('championName');
            const championImageElement = document.getElementById('championImage');
            const championPickPercentageElement = document.getElementById('championPickPercentage');

            if (!championNameElement || !championImageElement || !championPickPercentageElement) {
                console.error("Errore: Uno o più elementi della modale non trovati.");
                return;
            }

            // Aggiorna la modale con i dati del campione
            championNameElement.innerText = champName;
            championImageElement.src = champImage;
            championPickPercentageElement.innerText = `Percentuale di utilizzo: ${champPercentage}%`;

            // Mostra la modale
            const championModal = new bootstrap.Modal(championModalElement);
            championModal.show();
        });
    });

    console.log("✅ Script completato con successo!");
});