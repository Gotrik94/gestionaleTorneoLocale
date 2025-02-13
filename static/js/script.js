document.addEventListener("DOMContentLoaded", function () {
    var ctx = document.getElementById('torneiChart');

    if (ctx) {
        var torneiChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Spring Cup", "Summer Clash", "Autumn Arena"],
                datasets: [{
                    label: 'Squadre per Torneo',
                    data: [8, 12, 10],
                    backgroundColor: ['#ff9800', '#e68900', '#d67600'],
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ffffff' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#ffffff' } },
                    y: { ticks: { color: '#ffffff' }, grid: { color: '#444' } }
                }
            }
        });
    } else {
        console.error("⚠️ Il canvas del grafico non è stato trovato!");
    }
});

// Funzione per toggle sidebar su mobile
function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.style.transform = sidebar.style.transform === "translateX(0px)" ? "translateX(-100%)" : "translateX(0px)";
}
