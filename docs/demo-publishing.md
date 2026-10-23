# CFO-Demo auf ALL-INKL veröffentlichen

Ziel: **https://stricker-interim.de/cfo-demo/**. Die bestehende Website bleibt auf
ALL-INKL; kein Vercel-Konto oder zusätzlicher Node-Hosting-Tarif ist erforderlich.
Unternehmensdaten und Interpretationen sind fiktiv bzw. regelbasiert, ohne laufende
KI-Analyse. FX und EZB-Einlagensatz werden separat als öffentliche Marktquellen markiert.

## Anwendung und Marktadapter

- Next.js erzeugt 15 statische Seiten samt Assets und Navigationsdateien.
- `dashboard/scripts/build-demo.mjs` baut in einem temporären Projekt ohne die
  Next.js-API-Routen. Die Arbeitskopie und der lokale Entwicklungsserver werden nicht verändert.
- Der Builder ergänzt `out/api/market.php`. PHP ruft nur zwei fest definierte
  öffentliche HTTPS-Quellen ab, prüft die Daten und cached für eine Stunde im
  temporären Serververzeichnis, außerhalb des öffentlich erreichbaren Webroots.
- Der Client bekommt beim Build den Pfad `/cfo-demo/api/market.php`. Ein anderer
  Mount-Pfad wird über `CFO_DEMO_BASE_PATH` sowohl für Assets als auch API berücksichtigt.
- Der lokale Node-Server nutzt weiterhin `/api/market` mit demselben validierten
  Antwortformat. Kein manuelles Hin- und Herschieben von Quelldateien erforderlich.
- Fehlerhafte/fehlende FX-Daten führen zu HTTP 503; die Oberfläche zeigt den
  fiktiven Ersatz ausdrücklich an. Ein ausgefallener EZB-Abruf lässt FX verfügbar;
  Zinssatz und Zinsdatum sind dann null. Null Prozent ist ein gültiger EZB-Wert.

Voraussetzungen: PHP ab 7.4, cURL, ausgehende HTTPS-Verbindungen und ein beschreibbares
PHP-Temp-Verzeichnis. Vertrauliche Daten werden nicht an Marktquellen übermittelt.
CSV-Dateien werden ausschließlich lokal im Browser ausgewertet.

## Lokal bauen

```sh
cd dashboard
npm ci
npm run lint
npm run typecheck
npm test
npm run build:demo
npm run check:demo
```

`out/` enthält den vollständigen Web-Inhalt für den Ordner `cfo-demo/`, inklusive
PHP-Adapter und `.txt`-Navigationsdateien. Nie nur einzelne HTML-Dateien kopieren.
Ein für `/cfo-demo` gebautes Paket lässt sich nicht durch Umbenennen des Zielordners
an einen anderen Pfad verschieben; dafür neu bauen:

```sh
CFO_DEMO_BASE_PATH=/anderer-pfad npm run build:demo
CFO_DEMO_BASE_PATH=/anderer-pfad npm run check:demo
```

Der normale Node-Build bleibt separat mit `npm run build` prüfbar. Ein statischer
Python-/HTTP-Dateiserver kann PHP nicht ausführen und zeigt daher nur den
gekennzeichneten Markt-Fallback. Für einen vollständigen lokalen Adaptertest:

```sh
php -l out/api/market.php
php -S 127.0.0.1:8787 -t out
# In einem zweiten Terminal:
node --experimental-strip-types scripts/check-market-http.mjs http://127.0.0.1:8787/api/market.php
```

## Bestehender Website-Workflow

`../stricker-interim-website/.github/workflows/deploy.yml`:

1. Website und CFO-Repository (`main`) auschecken, Node 24 einrichten.
2. Lint, Typprüfung, Tests, statischen Build und Prüfung aller Seiten/Assets ausführen.
3. PHP-Syntax und den echten PHP-Adapter per lokalem HTTP-Aufruf prüfen, einschließlich
   JSON-Schema und Ablehnung nicht unterstützter POST-Anfragen.
4. Nur die freigegebenen öffentlichen Website-Dateien, Assets und `cfo-demo/` in
   `_site/` zusammenstellen. Die vorhandene Kontakt-Konfiguration wird dort erzeugt.
5. Gemeinsames Paket über die vorhandenen `FTP_*`-Secrets per FTPS übertragen.
6. Öffentliche Startseite, direkte Board-Unterseite und Markt-JSON nach dem Upload prüfen.

Dadurch werden Website-Links und Demo gemeinsam gebaut. FTPS ist kein atomarer
Release-Wechsel: während des Transfers kann es kurzzeitig gemischte Dateistände
geben. Vorherige erfolgreiche Workflow-Ausführung bzw. Git-Stand dient als Rollback.

Nach Dashboard-Änderungen zuerst `CFO-Repo/main` pushen, dann den Website-Workflow
unter **Actions → Website bei ALL-INKL veröffentlichen → Run workflow** starten.
Ein Push auf das Website-`main` startet dieselbe Veröffentlichung automatisch.
Es werden keine Hosting-Zugangsdaten in dieses öffentliche Repository übernommen.

## Website-Einstieg und Sprache

Die Website enthält Navigation und eine DE/EN-Vorschaukachel mit schematischen
SVG-Ansichten der September-Beispieldaten. `?lang=de` bzw. `?lang=en` setzt beim
Einstieg die Demo-Sprache; anschließende Wechsel werden lokal gespeichert.
Die Demo besitzt einen Rücklink zur Website und den vollständigen Rundgang.

Interaktive mobile Bedienwege wurden vom Nutzer anhand der Handyansicht bestätigt;
Screenshots des Board Reports wurden geprüft. Ein vollständiger automatisierter
Browser-/Gerätetest ist ohne Browser-Verbindung weiterhin offen. HTTP-, Asset- und
Finanztests sind getrennt davon dokumentiert und ersetzen keine visuelle Prüfung.
