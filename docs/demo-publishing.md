# Interaktive CFO-Demo für die Website

Die echte Datenanbindung ist vorerst geparkt. Diese Variante enthält ausschließlich
Beispieldaten, lokale Szenariorechner und kurze Kennzahlenerklärungen. Keine Anmeldung,
keine laufenden KI-Kosten und kein Python-/Node-Server auf dem Webspace erforderlich.

## Vorgesehener Zielpfad

`https://stricker-interim.de/cfo-demo/` — vorbereitet, noch nicht veröffentlicht.
Die bestehende Website nutzt laut Website-Repo ALL-INKL-Webspace; die Demo ist deshalb
als statisches Verzeichnis vorbereitet. Die Website-Repo bleibt zunächst unverändert.

## Erzeugen

Im Ordner `dashboard/`:

```sh
npm ci
npm run build:demo
```

Die Dateien unter `out/` gehören in das Webspace-Verzeichnis `cfo-demo/`. Nicht den
übergeordneten Ordner `out` selbst zusätzlich verschachteln. Beispiel:

```text
Webroot/
  index.html             bestehende Website
  cfo-demo/
    index.html
    kpi/index.html
    budget/index.html
    _next/...
    ...                  alle übrigen Exportdateien inklusive .txt-Navigationsdaten
```

Alle Dateien des Exports übernehmen; auch die `.txt`-Dateien sind für die Navigation
relevant. Keine Next.js-Server-Rewrite-Regeln nötig: Routen besitzen eigene index.html.
Den Export über HTTPS/HTTP testen, nicht über file:// öffnen.

Bei anderem Zielpfad muss vor dem Upload neu gebaut werden:

```sh
CFO_DEMO_BASE_PATH=/anderer-pfad npm run build:demo
CFO_DEMO_BASE_PATH='' npm run build:demo  # eigenständige Domain/Subdomain
```

Ein für `/cfo-demo` erzeugter Build lässt sich nicht durch bloßes Umbenennen des
Zielordners an eine andere Adresse verschieben; die Asset- und Routerpfade sind eingebaut.

## Konkrete Website-Verlinkung nach Veröffentlichung

Vorgesehener Linktext: **CFO-Dashboard live ausprobieren**.
Linkziel: `https://stricker-interim.de/cfo-demo/`.
Sinnvolle Position: im Leistungsbereich bei Unternehmenssteuerung/AI Finance, mit einem
kurzen Hinweis „Interaktive Demo mit Beispieldaten“. Erst verlinken, wenn die Zieladresse
funktioniert. Die bestehende Veröffentlichungs-Pipeline muss die Demo-Dateien bei
späteren Website-Deployments erhalten beziehungsweise selbst mit erzeugen.

## Kennzahlen-Infos

- Übersicht und KPI-Monitor: Definition, Zielabstand, vorhandener Vormonatsvergleich,
  Formel und Datenbasis. Fehlende Werte erhalten keine erfundene Bewertung.
- Fachmodule: Definition und die Werte der aktuellen Ansicht/des aktuellen Szenarios.
- Maus über Info-Symbol oder Tastaturfokus öffnet den Text; Antippen/Klicken fixiert ihn.
- Außerhalb tippen, erneute Aktivierung oder Esc schließt den Text.
- Demotexte sind regelbasiert und bleiben als Beispieldaten kenntlich.

## Vor dem öffentlichen Link noch prüfen

Desktop und Mobilgerät, Dark/Light, Hover/Tab/Touch/Esc, Monatswechsel und Szenarien,
direkte Unterseiten-Aufrufe, CSV/Markdown-Downloads und Druckansicht. Build-, Daten-
und Assetprüfungen sind durchgeführt; interaktive Browser-QA war ohne verbundenen
Browser nicht möglich. Live-Upload und Linkänderung sind noch nicht erfolgt.

## Vorbereitetes Paket

`artifacts/cfo-demo-website.zip` enthält bereits das Verzeichnis `cfo-demo/` mit allen
Exportdateien. Das Paket ist für `/cfo-demo/` gebaut. Es wurde nicht hochgeladen.
Der Export hat vierzehn Dashboard-Seiten; alle referenzierten lokalen Assets und Links
wurden gegen die erzeugten Dateien geprüft.

Prüfstand: 70 Tests, ESLint, TypeScript, Formatprüfung sowie regulärer und statischer
Build erfolgreich. Die Hosting-Veröffentlichung und Browser-Sichtprüfung stehen aus.

## Sichtbarer Hover-Einstieg

Die Info-Schaltflächen haben einen sichtbaren Kreisrand in Markenfarbe und heben
sich bei Hover leicht an (bei reduzierter Bewegung ohne Animation). Das Darüberfahren
über die gesamte Kennzahlenkarte öffnet die Erklärung; ein pixelgenaues Treffen des
Symbols ist nicht nötig. Tastatur- und Touch-Bedienung bleiben am Info-Button verfügbar.

## Ergänzung: Abschlussdarstellungen

Das aktualisierte Paket enthält vierzehn Dashboard-Seiten, darunter `/guv/`, `/bilanz/`
und `/cashflow/`. Die Abschlussdaten sind miteinander abgestimmt und werden auch
in der Übersicht sowie im Board Report verwendet. Das bestehende ZIP wird nach dem
neuen statischen Build ersetzt. Es wurde weiterhin nichts hochgeladen.

## Rundgang und Ziele

Der optionale Rundgang startet auf der Übersicht und führt über gefilterte überfällige
Forderungen zum historischen Cashflow. Unter `/annahmen/` sind aktive Ziele und
Modellgrenzen gebündelt. Zieländerungen im KPI-Monitor gelten während der Sitzung
auch für Übersicht, Liquiditätsreserve und Bericht; Neuladen setzt sie zurück.
Hover zeigt die kurze Einordnung, Aktivieren des Info-Symbols zusätzlich Definition,
Formel und Einschränkungen. Die Kontakt-Schaltfläche verweist auf die Website.

## HGB → IFRS

`/ifrs/` ergänzt die Demo um zwei schaltbare Beispielfälle und automatisch gekoppelte
latente Steuern. Überleitung, Wasserfall und Export teilen ein Anpassungsjournal.
Die HGB-Ausgangsdaten bleiben unverändert. Methodik, Bilanzkontrolle, Steuerbasis
und fachliche Primärquellen stehen direkt im Modul. Keine vollständige Erstanwendung.

## Erweiterter CSV-Test

Der Download und das direkte Beispiel nutzen zwölf fiktive Monate mit optionalen
Ergebnis-, Plan- und Bilanzangaben. Die lokale Analyse bietet Ertrag, Liquidität,
Kapitalstruktur, Plan-/Vormonatsvergleiche sowie Verläufe und einen kompletten
CSV-Export. Der Import bleibt vom übrigen Dashboard getrennt. Formathilfe permanent
sichtbar und am Eingabepanel ausgerichtet. Neue Validierungs- und Aggregationstests
prüfen insbesondere fehlende Werte, Stichtagsbezug und sofortige Vormonate.

Aktuelle Darstellung der CSV-Seite: kompakter Dreischritt ganz oben, ein Ablagefeld,
aufklappbare Formathilfe und wechselbare Auswertungsbereiche. Umfangreiche
Erklärungen, Diagramme und Quelldaten öffnen erst auf Wunsch. Die Beschreibung
einer permanent offenen Formathilfe weiter oben ist durch dieses Layout ersetzt.

## Aktueller Rundgang und Exportgrenze

Der Rundgang umfasst alle 14 Stationen in vier Kapiteln, mit besuchten/offenen
Stationen, Vor/Zurück, Direktsprüngen sowie Beenden/Fortsetzen. Ausprobieren ist
freiwillig; Marktdaten- und CSV-Quellen sind separat erklärt.

Prüfstand: 78 Tests, ESLint, TypeScript und regulärer Server-Build erfolgreich.
Alle Highlight-Ziele wurden in den gerenderten Seiten gefunden. Der statische
Export scheitert weiterhin an der neu hinzugefügten `/api/market`-Route. Das
vorhandene Website-ZIP wurde deshalb nicht ersetzt und enthält noch den alten
Rundgang. Keine Veröffentlichung erfolgt. Browser-Bedienprüfung steht aus.
