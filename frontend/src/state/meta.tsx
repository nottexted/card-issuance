import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMeta } from "../api/queries";
import type { MetaPayload } from "../api/types";

const MetaCtx = React.createContext<{ meta?: MetaPayload; isLoading: boolean; error?: Error }>({ isLoading: true });

export function MetaProvider({ children }: React.PropsWithChildren) {
  const q = useQuery({ queryKey: ["meta"], queryFn: getMeta, staleTime: 5 * 60 * 1000 });
  return <MetaCtx.Provider value={{ meta: q.data, isLoading: q.isLoading, error: q.error as any }}>{children}</MetaCtx.Provider>;
}

export function useMeta() {
  return React.useContext(MetaCtx);
}
