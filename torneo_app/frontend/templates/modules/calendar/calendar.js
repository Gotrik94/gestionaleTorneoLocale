const inizializzaCalendario = () => {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        firstDay: 1,
        initialView: window.innerWidth < 768 ? "timeGridWeek" : "dayGridMonth",
        themeSystem: "bootstrap",
        height: "auto",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        buttonText: {
            today: "Oggi",
            month: "Mese",
            week: "Settimana",
            day: "Giorno"
        },
        views: {
            dayGridMonth: {
                titleFormat: { year: "numeric", month: "long" }
            }
        },
        dayHeaderFormat: { weekday: "short" },
        locale: "it",
        events: function(fetchInfo, successCallback, failureCallback) {
            fetch("/api/tornei/")
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    return response.json();
                })
                .then(data => successCallback(data))
                .catch(error => failureCallback(error));
        },
        eventColor: "#f1c40f",
        eventTextColor: "#000",

        // TOOLTIP al passaggio del mouse
        eventMouseEnter: function(info) {
            const formatDate = (date) => {
                const d = new Date(date);
                return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };
            const tooltip = new bootstrap.Tooltip(info.el, {
                title: `${info.event.title}<br>${formatDate(info.event.start)} - ${formatDate(info.event.end)}`,
                html: true,
                placement: "top",
                trigger: "hover",
                container: "body"
            });
            tooltip.show();
            info.el.tooltipInstance = tooltip; // Salviamo l'istanza per la rimozione successiva
        },

        eventMouseLeave: function(info) {
            if (info.el.tooltipInstance) {
                info.el.tooltipInstance.dispose(); // Rimuove il tooltip quando il mouse esce
            }
        },

        // MODALE al click
        eventClick: function(info) {
            const formatDate = (date) => {
                const d = new Date(date);
                return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };

            document.getElementById("modal-title").innerText = info.event.title;
            document.getElementById("modal-body").innerHTML = `
                <p><strong>Data Inizio:</strong> ${formatDate(info.event.start)}</p>
                ${info.event.end ? `<p><strong>Data Fine:</strong> ${formatDate(info.event.end)}</p>` : ""}
                <p><strong>Descrizione:</strong> ${info.event.extendedProps.description || "Nessuna descrizione disponibile."}</p>
            `;
            const modal = new bootstrap.Modal(document.getElementById("eventModal"));
            modal.show();
        }
    });

    calendar.render();
};

// Avvio script dopo il caricamento del DOM
document.addEventListener("DOMContentLoaded", inizializzaCalendario);
