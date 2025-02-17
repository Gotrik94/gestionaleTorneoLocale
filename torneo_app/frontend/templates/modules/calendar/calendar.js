const inizializzaCalendario = () => {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) {
    console.error("❌ Errore: Elemento #calendar non trovato!");
    return;
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    firstDay: 1, // Imposta lunedì come primo giorno della settimana
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",
    height: "auto", // Riduce l'altezza del calendario automaticamente
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
        titleFormat: { year: "numeric", month: "long" } // Es: "Febbraio 2025"
      }
    },
    dayHeaderFormat: { weekday: "short" }, // Es: "Lun, Mar, Mer..."
    locale: "it", // Imposta la lingua italiana
    events: "/api/eventi/", // URL API per recuperare gli eventi
    eventColor: "#f1c40f",
    eventTextColor: "#000"
  });

  calendar.render();
};

document.addEventListener("DOMContentLoaded", inizializzaCalendario);
