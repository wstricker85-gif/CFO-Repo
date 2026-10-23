/** Shared tour content and session-only progress, independent of financial data. */
export const tourChapters = [
  "Überblick",
  "Abschluss & Liquidität",
  "Planung & Bewertung",
  "Selbst ausprobieren",
  "Individuelle Lösung",
] as const;
export type TourStep = {
  path: string;
  label: string;
  chapter: (typeof tourChapters)[number];
  title: string;
  description: string;
  benefit: string;
  tryIt: string;
  dataNote: string;
  target: string;
};
const company = "Fiktive Unternehmensdaten · Regelbasierte Auswertung, keine KI-Analyse.";
export const tourSteps: TourStep[] = [
  {
    path: "/",
    label: "Übersicht",
    chapter: "Überblick",
    title: "Das Unternehmen auf einen Blick",
    description:
      "Vier Kernkennzahlen, ein Management-Briefing und nächste Schritte bündeln den Monatsabschluss.",
    benefit: "Du erkennst, wo du für die weitere Analyse ansetzen kannst.",
    tryIt: "Wechsle den Berichtsmonat oder öffne das Info-Symbol einer Kennzahl.",
    dataNote: company,
    target: ".kpi-grid",
  },
  {
    path: "/kpi",
    label: "KPI Monitor",
    chapter: "Überblick",
    title: "Signale erkennen",
    description:
      "Kennzahlen sind nach Ertrag, Liquidität, Effizienz und Risiko geordnet. Ampeln vergleichen die Werte mit den Demo-Zielen.",
    benefit: "Auffälligkeiten lassen sich gezielt eingrenzen; eine Datenlücke bleibt sichtbar.",
    tryIt: "Filtere nach einer Kategorie oder dem Status „Beobachten“.",
    dataNote: company,
    target: "#zielwerte",
  },
  {
    path: "/analyse",
    label: "Finanzanalyse",
    chapter: "Überblick",
    title: "Ergebnisabweichungen verstehen",
    description:
      "Die Ergebnisbrücke erklärt den Unterschied zwischen Plan- und Ist-EBITDA. Die Kostenstruktur zeigt die wichtigsten Aufwandsblöcke.",
    benefit: "Du kannst Ergebniswirkungen nachvollziehen, ohne unbelegte Ursachen zu unterstellen.",
    tryIt: "Wechsle zwischen Monat und dem Zeitraum seit Januar.",
    dataNote: company,
    target: ".module-toolbar",
  },
  {
    path: "/guv",
    label: "GuV",
    chapter: "Abschluss & Liquidität",
    title: "Vom Umsatz zum Gewinn",
    description:
      "Die GuV führt über EBITDA, Abschreibungen, Zinsen und Steuern bis zum Ergebnis nach Steuern.",
    benefit: "Du siehst, welche Ergebnisstufe eine Veränderung erklärt.",
    tryIt: "Schalte zwischen Monat und Jahresverlauf oder ändere die Tabelleneinheit.",
    dataNote: company,
    target: ".statement-controls",
  },
  {
    path: "/bilanz",
    label: "Bilanz",
    chapter: "Abschluss & Liquidität",
    title: "Vermögen und Finanzierung",
    description:
      "Aktiva und Passiva zeigen die Mittelverwendung und Finanzierung zu einem Stichtag.",
    benefit: "Du erkennst Kapitalbindung und Eigenkapitalstruktur; die Bilanz bleibt abgestimmt.",
    tryIt: "Vergleiche mit dem Vormonat oder dem Jahresanfang.",
    dataNote: "Fiktive Stichtagsbestände. Bestände werden nicht wie Monatsumsätze addiert.",
    target: ".balance-comparison",
  },
  {
    path: "/cashflow",
    label: "Cashflow",
    chapter: "Abschluss & Liquidität",
    title: "Wo bleibt das Geld?",
    description:
      "Die Cashflow-Brücke erklärt, wie Ergebnis, Kapitalbindung, Investitionen und Finanzierung den Geldbestand verändern.",
    benefit: "Gewinn und Zahlungseingänge werden voneinander unterscheidbar.",
    tryIt: "Wechsle zwischen Monat und Jahresverlauf und verfolge die Überleitung.",
    dataNote: "Historischer Cashflow aus fiktiven, abgestimmten Buchungsdaten; keine Prognose.",
    target: ".statement-controls",
  },
  {
    path: "/ifrs",
    label: "HGB → IFRS",
    chapter: "Abschluss & Liquidität",
    title: "Bilanzierungsunterschiede erklären",
    description:
      "Leasing und Entwicklungskosten überleiten den Demoabschluss zu einer vereinfachten IFRS-Perspektive. Latente Steuern folgen automatisch.",
    benefit:
      "Du siehst die Wirkung auf Bilanz, Eigenkapital und Ergebnis aus einem gemeinsamen Journal.",
    tryIt: "Schalte einen Beispielfall aus und beobachte die Eigenkapitalbrücke.",
    dataNote:
      "Vereinfachtes IFRS-Beispiel, keine vollständige Erstanwendung. Der Ausgangsabschluss bleibt unverändert.",
    target: ".ifrs-case-grid",
  },
  {
    path: "/working-capital",
    label: "Working Capital",
    chapter: "Abschluss & Liquidität",
    title: "Gebundenes Kapital sichtbar machen",
    description:
      "Forderungen, Vorräte und Lieferverbindlichkeiten erklären die Kapitalbindung. Offene Posten zeigen die Altersstruktur.",
    benefit: "Du kannst Handlungsfelder für das Forderungsmanagement untersuchen.",
    tryIt:
      "Bewege den Regler für schnellere Zahlungseingänge und prüfe das rechnerische Cash-Potenzial.",
    dataNote: "Fiktive Rechnungen. Das DSO-Szenario verändert den Zahlungsplan nicht automatisch.",
    target: "#dso-reduction",
  },
  {
    path: "/bewertung",
    label: "Bewertung",
    chapter: "Planung & Bewertung",
    title: "Annahmen und Unternehmenswert",
    description:
      "Das DCF-Modell zeigt, wie Wachstum, Marge und Kapitalkosten die Bewertung verändern.",
    benefit: "Du kannst die Abhängigkeit des Modellwerts von den Annahmen nachvollziehen.",
    tryIt: "Ändere den WACC und vergleiche Wert und Sensitivitätstabelle.",
    dataNote:
      "Vereinfachte fiktive DCF-Annahmen; keine geprüfte Unternehmensbewertung. Marktdaten ändern den WACC nicht automatisch.",
    target: "#wacc",
  },
  {
    path: "/budget",
    label: "Budget & Forecast",
    chapter: "Planung & Bewertung",
    title: "Das Restjahr gestalten",
    description:
      "Abgeschlossene Ist-Monate und der Forecast für das Restjahr ergeben eine mögliche Jahreslandung.",
    benefit: "Chancen und Risiken lassen sich anhand transparenter Annahmen vergleichen.",
    tryIt: "Wähle ein Szenario oder verändere Umsatz und fixe Kosten für die verbleibenden Monate.",
    dataNote:
      "Fiktive Planung. Szenarioänderungen lassen die abgeschlossenen Ist-Monate unverändert.",
    target: "#forecast-revenue",
  },
  {
    path: "/markt",
    label: "Marktdaten",
    chapter: "Planung & Bewertung",
    title: "Marktumfeld einordnen",
    description:
      "Währungsumrechnung und Vergleichsunternehmen liefern Kontext. Die Quellenanzeige unterscheidet externe Abrufe von Demo-Annahmen.",
    benefit: "Du kannst Datenherkunft und Referenzstand prüfen, bevor du Zahlen interpretierst.",
    tryIt: "Rechne EUR in eine andere Währung um und prüfe darunter den Quellenstatus.",
    dataNote:
      "FX und EZB-Zins gemäß angezeigtem Abrufstatus; bei Ausfall Demo-Fallback. Peer-Unternehmen und Multiples bleiben fiktiv.",
    target: ".fx-converter",
  },
  {
    path: "/board",
    label: "Board Report",
    chapter: "Planung & Bewertung",
    title: "Erkenntnisse klar berichten",
    description:
      "Eine regelbasierte Berichtsvorlage führt Kennzahlen, Abschlussdarstellungen und empfohlene Maßnahmen zusammen.",
    benefit:
      "Du kannst einen Managementbericht mit konsistenten Zahlen und eigenen Ergänzungen zusammenstellen.",
    tryIt: "Wechsle zwischen Executive Flash und Board Pack oder exportiere den Bericht.",
    dataNote:
      "Deterministische Vorlage, keine ausgeführte KI. Texteingaben bleiben in dieser Ansicht und können exportiert werden.",
    target: ".report-controls",
  },
  {
    path: "/daten",
    label: "CSV-Demo & Auswertung",
    chapter: "Selbst ausprobieren",
    title: "Mit einer Datei selbst ausprobieren",
    description:
      "Eine Test-CSV mit zwölf Monaten zeigt die lokale Datenprüfung und eine eigene Finanzanalyse.",
    benefit: "Du erlebst den Weg von einer Datei zu Kennzahlen, Planvergleichen und Diagrammen.",
    tryIt: "Wähle „Beispiel direkt laden“ und öffne unten einen Auswertungsbereich.",
    dataNote:
      "Lokale CSV-Vorschau ohne Server- oder KI-Upload. Sie ersetzt die Daten der übrigen Dashboard-Module nicht.",
    target: ".csv-quickstart",
  },
  {
    path: "/annahmen",
    label: "Annahmen & Ziele",
    chapter: "Selbst ausprobieren",
    title: "Die Bewertungsbasis nachvollziehen",
    description:
      "Hier findest du Zielkorridore und Modellgrenzen. Der Link zum KPI-Monitor öffnet den Editor für gemeinsame Ziele.",
    benefit: "Du erkennst, welche Annahmen die Ampeln und Erläuterungen beeinflussen.",
    tryIt: "Öffne „Zielwerte anpassen“ oder sieh dir die aktiven Zielkorridore an.",
    dataNote:
      "Eigene Ziele gelten in dieser Sitzung für Übersicht, KPI-Monitor, Liquiditätsreserve und Bericht. Neuladen setzt sie zurück.",
    target: ".module-panel",
  },
  {
    path: "/projekt",
    label: "Dein CFO-Dashboard",
    chapter: "Individuelle Lösung",
    title: "Von der Demo zu deiner Lösung",
    description:
      "Ein individuelles CFO-Dashboard mit Datenanbindung und AI-Integration wird in Kooperation mit Swissi Holding AG projektiert.",
    benefit:
      "Du siehst den möglichen Leistungsumfang und wie Datenschutz, Compliance und fachliche Kontrollen in das Projekt einfließen.",
    tryIt: "Sieh dir die vorgesehenen Kontrollen an oder öffne die Partner-Website von Swissi.",
    dataNote:
      "Projektangebot, keine bereits angeschlossene produktive AI. Anforderungen und Konformität werden für den konkreten Einsatz geprüft.",
    target: ".project-governance",
  },
];
export function normalizeTourPath(path: string) {
  return path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}
export function tourIndex(path: string) {
  const normalized = normalizeTourPath(path);
  return tourSteps.findIndex((step) => step.path === normalized);
}
export type TourState = {
  active: boolean;
  visited: string[];
  lastPath: string | null;
  finished: boolean;
};
export const initialTourState: TourState = {
  active: false,
  visited: [],
  lastPath: null,
  finished: false,
};
export type TourAction =
  | { type: "start"; path?: string }
  | { type: "visit"; path: string }
  | { type: "resume" }
  | { type: "stop" }
  | { type: "finish" };
export function tourReducer(state: TourState, action: TourAction): TourState {
  if (action.type === "start") {
    const path = action.path && tourIndex(action.path) >= 0 ? normalizeTourPath(action.path) : "/";
    return { active: true, visited: [path], lastPath: path, finished: false };
  }
  if (action.type === "resume") return { ...state, active: true, finished: false };
  if (action.type === "stop") return { ...state, active: false };
  if (action.type === "finish") return { ...state, active: false, finished: true };
  const path = normalizeTourPath(action.path);
  if (!state.active || tourIndex(path) < 0) return state;
  if (state.lastPath === path && state.visited.includes(path)) return state;
  return {
    ...state,
    lastPath: path,
    visited: state.visited.includes(path) ? state.visited : [...state.visited, path],
  };
}
export function tourProgress(state: TourState, currentPath: string) {
  const index = tourIndex(currentPath),
    path = normalizeTourPath(currentPath);
  const visited = new Set(state.visited.filter((p) => tourIndex(p) >= 0));
  if (state.active && index >= 0) visited.add(path);
  return {
    index,
    step: tourSteps[index] ?? null,
    visited,
    remaining: tourSteps.filter((s) => !visited.has(s.path)),
    previous: index > 0 ? tourSteps[index - 1] : null,
    next: index >= 0 && index < tourSteps.length - 1 ? tourSteps[index + 1] : null,
  };
}
