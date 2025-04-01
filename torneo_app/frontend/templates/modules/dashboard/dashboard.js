document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ dashboard.js caricato correttamente!");
    initGaugeChart();
});


function initGaugeChart() {
    var canvas = document.getElementById("gaugeChart");

    if (!canvas) {
        console.error("⚠️ Elemento canvas non trovato!");
        return;
    }

    var ctx = canvas.getContext("2d");

    var percentualeBlu = parseFloat(canvas.dataset.blu) || 0;
    var percentualeRossa = parseFloat(canvas.dataset.rosso) || 0;

    if (percentualeBlu + percentualeRossa === 0) {
        console.warn("⚠️ Nessun dato valido per il grafico.");
        return;
    }

    var gaugeChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Lato Blu", "Lato Rosso"],
            datasets: [{
                data: [percentualeBlu, percentualeRossa],
                backgroundColor: ["#3498db", "#e74c3c"],
                borderWidth: 2,
                borderColor: "#1c1c1c",
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: 270,
            cutout: "65%", // Rende il centro più piccolo
            animation: {
                animateRotate: true,
                animateScale: true
            },
            plugins: {
                legend: {
                    display: true,
                    position: "left", // Sposta la legenda a sinistra
                    labels: {
                        color: "#ffffff",
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            return tooltipItem.label + ": " + tooltipItem.raw.toFixed(1) + "%";
                        }
                    }
                },
                datalabels: {
                    color: "#ffffff",
                    font: {
                        weight: "bold",
                        size: 16
                    },
                    anchor: "center",
                    align: "center",
                    formatter: (value) => value.toFixed(1) + "%"
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    console.log("✅ Grafico caricato correttamente.");
}




