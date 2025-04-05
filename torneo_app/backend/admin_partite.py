from django.contrib import admin
from django.utils.html import format_html

from backend.models.partita import Partita





# 🔎 Filtro per partite BYE
class ByeFilter(admin.SimpleListFilter):
    title = 'Contiene BYE'
    parameter_name = 'bye'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Solo partite con BYE'),
            ('no', 'Solo partite senza BYE'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(
                squadra_rossa__isnull=True
            ) | queryset.filter(
                squadra_blu__isnull=True
            )
        if self.value() == 'no':
            return queryset.filter(
                squadra_rossa__isnull=False,
                squadra_blu__isnull=False
            )
        return queryset


@admin.register(Partita)
class PartitaAdmin(admin.ModelAdmin):
    list_display = ("id", "torneo", "squadra_rossa", "squadra_blu", "data_evento", "conclusa", "is_bye")

    def get_queryset(self, request):
        # Override per usare tutte le partite (inclusi BYE)
        return Partita.objects.all_with_bye()

    def is_bye(self, obj):
        return not obj.squadra_rossa or not obj.squadra_blu
    is_bye.boolean = True  # ✅ mostra icona ✔/✖ nel pannello admin

    @admin.display(description='BYE')
    def has_bye(self, obj):
        if obj.squadra_rossa is None or obj.squadra_blu is None:
            return format_html('<span style="color: red; font-weight: bold;">BYE</span>')
        return format_html('<span style="color: green;">✔</span>')
