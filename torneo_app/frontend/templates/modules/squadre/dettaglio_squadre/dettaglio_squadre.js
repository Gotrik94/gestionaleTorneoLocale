document.addEventListener("DOMContentLoaded", function () {
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
        ctx.canvas.style.borderRadius = '8px'; // Opzionale: aggiungi un bordo arrotondato
        ctx.canvas.style.padding = '10px'; // Opzionale: aggiungi un po' di padding

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
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#fff' }
                    },
                    x: {
                        ticks: { color: '#fff' }
                    }
                }
            }
        });
    }
});