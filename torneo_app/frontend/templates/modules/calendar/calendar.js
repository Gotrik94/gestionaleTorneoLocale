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
          Promise.all([
            fetch("/api/tornei/calendar_schedule_tornei")
              .then(response => {
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                return response.json();
              }),
            fetch("/api/partita/calendar_schedule_partita")
              .then(response => {
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                return response.json();
              })
          ])
          .then(([torneiData, partitaData]) => {


              // 🔧 Estrai tornei e fasi separatamente
              const tornei = torneiData.tornei || [];
              const fasi = torneiData.fasi || [];

              const getEventColors = (tipo) => {
                switch (tipo) {
                  case "torneo": return { color: "#f1c40f", textColor: "#000" };
                  case "fase": return { color: "#e67e22", textColor: "#fff" };
                  case "partita": return { color: "#3498db", textColor: "#fff" };
                  default: return { color: "#6c757d", textColor: "#fff" };
                }
              };


                const eventiTornei = tornei.map(ev => ({
                  ...ev,
                  ...getEventColors(ev.tipo)
                }));

                const eventiFasi = fasi.map(ev => ({
                  ...ev,
                  ...getEventColors(ev.tipo)
                }));

                const eventiPartite = partitaData.map(ev => ({
                  ...ev,
                  tipo: "partita",
                  ...getEventColors("partita")
                }));

                const allEvents = [...eventiTornei, ...eventiFasi, ...eventiPartite];


            successCallback(allEvents);
          })
          .catch(error => failureCallback(error));
        },

        // TOOLTIP al passaggio del mouse
        eventMouseEnter: function(info) {
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            };

            const startDate = formatDate(info.event.start);
            const endDate = formatDate(info.event.end);

            const dateText = (endDate && endDate !== startDate)
                ? `${startDate} - ${endDate}`
                : startDate;

            const tooltip = new bootstrap.Tooltip(info.el, {
                title: `${info.event.title.replace(/\n/g, "<br>")}<br><small>${dateText}</small>`,
                html: true,
                placement: "top",
                trigger: "hover",
                container: "body"
            });

            tooltip.show();
            info.el.tooltipInstance = tooltip;
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
