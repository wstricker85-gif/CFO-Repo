"use client";

import { useTranslation } from "@/components/i18n/Language";
import { createContext, useContext, useState, useReducer, type Dispatch } from "react";
import { applyDemoRules, validateRules, type DemoRules } from "@/lib/demo-policy";
import { tourReducer, initialTourState, type TourState, type TourAction } from "@/lib/tour";
import type { DemoSnapshot } from "@/lib/demo-data";

type DemoContextValue = {
  rules: DemoRules;
  setRules: (rules: DemoRules) => void;
  tour: TourState;
  dispatchTour: Dispatch<TourAction>;
  snapshots: DemoSnapshot[];
  snapshot: DemoSnapshot;
  period: string;
  setPeriod: (period: string) => void;
  history: { month: string; revenue: number; budget: number; ebitda: number }[];
};
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({
  snapshots,
  history,
  children,
}: Omit<
  DemoContextValue,
  "snapshot" | "period" | "setPeriod" | "rules" | "setRules" | "tour" | "dispatchTour"
> & { children: React.ReactNode }) {
  useTranslation();
  const [period, setPeriod] = useState(snapshots[0].id);
  const [rules, updateRules] = useState<DemoRules>({});
  const [tour, dispatchTour] = useReducer(tourReducer, initialTourState);
  const setRules = (next: DemoRules) => updateRules(validateRules(next));
  const snapshot = applyDemoRules(snapshots.find((s) => s.id === period) ?? snapshots[0], rules);
  return (
    <DemoContext.Provider
      value={{
        snapshots,
        history,
        period,
        setPeriod,
        snapshot,
        rules,
        setRules,
        tour,
        dispatchTour,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("DemoProvider fehlt");
  return value;
}
