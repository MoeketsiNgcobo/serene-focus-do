import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getWorkforceSettings,
  saveWorkforceSettings,
} from "./workforce-ai.functions";
import { DEFAULT_CONTEXT, type Engine } from "./workforce-ai";

type Ctx = {
  globalContext: string;
  setGlobalContext: (v: string) => void;
  engine: Engine;
  setEngine: (e: Engine) => void;
  loaded: boolean;
};

const WorkforceCtx = createContext<Ctx | null>(null);

export function WorkforceProvider({ children }: { children: ReactNode }) {
  const getFn = useServerFn(getWorkforceSettings);
  const saveFn = useServerFn(saveWorkforceSettings);
  const [globalContext, setGlobalContext] = useState(DEFAULT_CONTEXT);
  const [engine, setEngine] = useState<Engine>("mock");
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    getFn()
      .then((s) => {
        if (!active) return;
        setGlobalContext(s.global_context || DEFAULT_CONTEXT);
        setEngine((s.engine as Engine) || "mock");
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [getFn]);

  // Debounced persistence whenever context/engine changes after load.
  useEffect(() => {
    if (!loaded) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveFn({ data: { global_context: globalContext, engine } }).catch(() => {});
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [globalContext, engine, loaded, saveFn]);

  return (
    <WorkforceCtx.Provider
      value={{ globalContext, setGlobalContext, engine, setEngine, loaded }}
    >
      {children}
    </WorkforceCtx.Provider>
  );
}

export function useWorkforce() {
  const ctx = useContext(WorkforceCtx);
  if (!ctx) throw new Error("useWorkforce must be used within WorkforceProvider");
  return ctx;
}
