import React from "react";
import { Chip } from "@mui/material";

const map: Record<string, { label?: string; color?: any; variant?: any }> = {
  NEW: { color: "default" },
  IN_REVIEW: { color: "warning" },
  APPROVED: { color: "success" },
  IN_BATCH: { color: "info" },
  REJECTED: { color: "error" },
  CREATED: { color: "default" },
  SENT: { color: "info" },
  RECEIVED: { color: "success" },
  ISSUED: { color: "info" },
  DELIVERED: { color: "warning" },
  HANDED: { color: "success" },
  ACTIVATED: { color: "success" },
  CLOSED: { color: "default" },
};

export default function StatusChip({ code, name }: { code: string; name?: string }) {
  const cfg = map[code] || { color: "default" };
  return <Chip size="small" label={name || code} color={cfg.color} sx={{ fontWeight: 700 }} />;
}
