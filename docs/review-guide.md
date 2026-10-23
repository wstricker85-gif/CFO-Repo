# Zwischenstand — CFO Dashboard

Die Demo läuft lokal mit `cd dashboard && npm run dev` unter http://localhost:3000.
Die Website-Repo blieb unverändert; es wurde nichts veröffentlicht oder committed.

## Empfohlene Reihenfolge für die gemeinsame Durchsicht

1. **Übersicht:** August/September wählen. Der Monat bleibt beim Modulwechsel erhalten.
2. **KPI Monitor:** Kategorie und Status filtern, Definitionen öffnen, eigene Demo-Ziele testen.
   Die Änderungen gelten ausdrücklich nur innerhalb dieser Modulansicht.
3. **Finanzanalyse:** Monat/YTD wechseln und die Plan-Ist-Brücke mit dem EBITDA abstimmen.
4. **Working Capital:** Altersklasse anklicken, nach Kunde suchen, DSO-Szenario verändern.
   Cash-Potenzial und Cash-Forecast werden separat gezeigt.
5. **Bewertung:** Vorsichtig/Basis/Chancen wählen; WACC und Marge verändern; Sensitivität und
   FCF-Tabelle vergleichen. Alle Annahmen können im CSV nachvollzogen werden.
6. **Budget:** Risiko-Szenario wählen. Ist-Monate bleiben unverändert; nur das Restjahr reagiert.
7. **Marktdaten:** Fiktive Referenzen ansehen, Währungen tauschen. Es sind keine echten Kurse.
8. **Board Report:** Format und Abschnitte wählen, Management-Notizen ergänzen, Markdown
   exportieren oder den Browser-Druckdialog nutzen. Notizen werden nicht automatisch gespeichert.
9. **Daten & Quellen:** Mit der Beispieldatei starten, Vorlage herunterladen und eigene CSV
   lokal prüfen. Vorschau und Demo-Unternehmen werden nicht vermischt.

## Nächste Produktentscheidungen

- Welche fünf bis acht Kennzahlen sollen auf deiner Startseite stehen?
- Welche Konten-/Exportstruktur nutzt du tatsächlich (z. B. DATEV, ERP, eigener Monatsabschluss)?
- Soll der erste produktive Anwendungsfall Reporting, Liquidität oder Budgetsteuerung sein?
- Welche Daten sollen mandantenübergreifend gleich strukturiert sein und welche firmenspezifisch?

Zuerst einen echten Ende-zu-Ende-Pfad mit geschütztem Import und geprüfter Berechnung
umsetzen, danach die Agent-Interpretation anbinden. Die aktuellen Markdown-Agenten sind
weiterhin Spezifikationen, keine im Hintergrund laufenden Agenten.

## Prüfgrenzen

Build, Lint, Typprüfung und automatisierte Fach-/Vertragstests werden durchgeführt.
Die laufenden Seiten und CSS-Dateien werden per HTTP geprüft. Eine vollständige
Browserprüfung von Klicks, Downloads, mobilen Ansichten und Druckausgabe war in dieser
Sitzung ohne Browser-Verbindung nicht möglich; diese Punkte stehen für die gemeinsame
Sichtprüfung noch aus.

## Abschließender Prüfstand

- 31 automatisierte Tests erfolgreich.
- ESLint und TypeScript ohne Fehler.
- Prettier-Formatprüfung erfolgreich.
- Produktionsbuild mit Webpack erfolgreich; alle neun Dashboard-Routen erzeugt.
- Alle neun laufenden Routen per HTTP mit Status 200 geprüft.
- Genau ein Hauptinhalt und eine Hauptüberschrift je Route, passende aktive Navigation.
- Ausgeliefertes CSS enthält die Fachmodule, responsive Ansichten und Druckregeln.
- Browser-Klicktests und visuelle Prüfung bleiben offen; es war kein Browser verbunden.

## Ergänzung: öffentliche Demo & Kennzahlen-Infos

Datenanbindung zunächst geparkt. Über die neuen Info-Symbole Definition, dynamische
Einordnung und Formeln prüfen: Hover, Tab-Fokus, Klick/Touch fixieren, außen tippen
oder Esc schließen. Monat und Zielwerte ändern und den Text erneut prüfen.

Der statische Export und ein Paket für `/cfo-demo/` sind vorbereitet. Veröffentlichung
und Website-Link stehen noch aus; Details in demo-publishing.md. Neuester Prüfstand:
38 erfolgreiche Tests und beide Build-Varianten (Server/static export).

## Neu: Bilanz, vollständige GuV und historischer Cashflow

Direkt auf der Übersicht oder links in der Navigation öffnen:

- `/guv`: Monat/YTD, Ergebnis nach Abschreibungen, Zinsen und Steuern, Planvergleich
  und monatlicher Ergebnisverlauf. Info-Symbole erläutern einzelne Positionen.
- `/bilanz`: Aktiva/Passiva, Vormonat oder Jahresanfang als Vergleich, Eigenkapitalquote
  und Vermögens-/Finanzierungsstruktur. Aktiva und Passiva stimmen auf den Cent überein.
- `/cashflow`: Indirekte Überleitung, operativer/investiver/Finanzierungs-Cashflow,
  Wasserfall und genaue Abstimmung auf die liquiden Mittel. Historische Werte, kein Forecast.

Alle drei: detaillierte oder verdichtete Ansicht, Tabellen in EUR/Tsd. EUR, CSV-Export
und kurze Analyse aus denselben Beispieldaten. Board Pack und Markdown-Export enthalten
ebenfalls die Abschlusszusammenfassung. Die Navigation ist für die zusätzlichen Seiten
auf kleinen Bildschirmen scrollbar. Neuester Prüfstand: 51 Tests erfolgreich.

## Aktueller Prüfstand: Rundgang und gemeinsame Ziele

54 Tests sowie TypeScript, ESLint, Formatprüfung und beide Produktionsbuilds grün.
13 exportierte Dashboard-Routen: ein main/h1 je Seite; lokale Links und Assets
gegen Export geprüft; Website-ZIP aktualisiert. Browser war weiterhin nicht verbunden.

Manuell prüfen: Rundgang auf der Übersicht starten, Weiter zu >30 Tage überfälligen
Posten und Cashflow. Unter Annahmen & Ziele den Editor öffnen; DSO-Grün auf 50,
Cash-Grün auf 900000 setzen. September: DSO grün, Cash gelb, gleicher Status in
Übersicht und Board Report; Markdown enthält aktive Ziele. Monat wechseln,
Zielwerte zurücksetzen. Hover kurz, Aktivierung des Info-Symbols mit Methodik,
Esc/außerhalb schließen. Dark/Light, mobile Navigation und Druckansicht prüfen.

## HGB → IFRS prüfen

Unter „Abschluss & Liquidität“ nach Cashflow öffnen. Monatswechsel August/September,
GuV Monat/YTD, Bilanz/GuV und EUR/Tsd. EUR prüfen. Beide Beispielfälle einzeln und
zusammen deaktivieren/aktivieren: Bilanzkontrolle immer null; beide aus ergibt HGB.
Eigenkapitalbrücke bleibt kumuliert, auch bei Monats-GuV. Steuerwirkung folgt den
Fällen automatisch. September mit beiden Fällen: IFRS-Demo-Eigenkapital
2.588.323,67 EUR; Monats-Nettoergebnis 134.339,45 EUR. CSV enthält beide
Abschlüsse und das vollständige Anpassungsjournal. Methoden aufklappen, Info-
Symbole, Quelllinks, Tastatur, Dark/Light und mobile Tabellen prüfen.

62 Tests, ESLint, TypeScript, Formatprüfung und beide Builds erfolgreich.
14 exportierte Seiten mit je einem main/h1 und korrekter aktiver Navigation;
alle lokalen Links/Assets geprüft, Website-Paket aktualisiert. Browserprüfung
bleibt ohne verbundenen Browser offen.

## Erweiterte CSV-Vorschau

„Test-CSV herunterladen“ oder „Mit Beispieldatei testen“ verwendet zwölf fiktive
Monate und 16 Eingabespalten. Nach der Prüfung: 17 Kennzahlen/Vergleiche, drei
Verläufe, Monatsauswahl, vollständige Quelldatentabellen und reimportierbarer CSV-
Export. Alte fünfspaltige Dateien bleiben gültig; optionale Werte fehlen sichtbar.
Gesamtdatei: Umsatz 14.090.000 EUR, EBITDA 2.194.880 EUR, Jahresergebnis
1.270.416 EUR; liquide Mittel 980.000 EUR am Dezemberende. Septemberauswahl:
Umsatz 1.280.000 EUR, Ergebnis 122.500 EUR, liquide Mittel 842.000 EUR.
Formathilfe dauerhaft sichtbar, linke/rechte Kachel oben und unten bündig.
70 Tests erfolgreich; visuelle Prüfung ohne verbundenen Browser weiterhin offen.

## Aktuell: kompakte CSV-Seite

Die Seite beginnt mit Download/direktem Beispiel, Dateiauswahl und Ergebnisziel.
Vorlagen-Download und direktes Laden prüfen. Eigene Datei auswählen oder ablegen;
Entfernen und Fehlerzustand prüfen. Format und Einstellungen sind aufklappbar.
Nach Import die vier Auswertungsbereiche wechseln und Monat auswählen; Einordnung,
Verläufe und Quelldaten einzeln öffnen. Export enthält weiterhin alle Quelldaten.
Kein globaler Demo-Monatswähler auf dieser lokalen Seite; alle anderen Module
behalten ihn. Ein kompakter Projekt-CTA ersetzt die doppelten Angebotsbereiche.
Die Finanzberechnungen sind unverändert (70 Tests). Browser war nicht verbunden.

## Vollständiger Rundgang

Auf der Übersicht oder im Header starten: vier Kapitel / 14 Stationen. Vor/Zurück
und direkte Stationssprünge testen; Besuche dürfen nur einmal zählen. Aktionen
sind freiwillig. Auf breiten Screens am Rand, sonst kompakt unten aufklappbar.
„Stelle anzeigen“ springt nur auf ausdrücklichen Klick zum hervorgehobenen Bereich.
Beenden, im Header fortsetzen und neu starten; Änderungen an Finanzannahmen
bleiben davon unberührt. Früher Abschluss nennt die tatsächliche Besuchszahl
und bietet offene Stationen an. Route 404 darf keinen Besuch erzeugen.
Markt-/CSV-/Demo-Quellenhinweise prüfen. Tastatur, schmaler Bildschirm, beide
Themes und reduzierte Bewegung visuell prüfen, sobald Browser verfügbar ist.
Der statische Export bleibt durch die separat hinzugefügte Markt-API blockiert.

## Individuelle Lösung / Swissi

Eigene Kategorie führt zu `/projekt`. Partnername, Link zu Swissi und Kontakt-CTAs
prüfen. Datenschutz-/Compliance-Ziel wird anhand konkreter Projektkontrollen
erklärt; Freigabe bleibt an den konkreten Einsatz gebunden. Kein Demo-Monatswähler
oder fiktiver Bilanzstichtag auf der Angebotsseite. CSV-Seite verlinkt nur kurz.
Der vollständige Rundgang hat nun 15 Stationen in fünf Kapiteln; Projektangebot
ist die letzte Station. Die bisherigen Fortschritts-/Navigationsprüfungen bleiben
erhalten und prüfen alle neuen Seiten.
