import React from "react";
import { Box, Typography } from "@mui/material";

export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box sx={{ border: "1px dashed #d7dcec", borderRadius: 3, p: 4, textAlign: "center", background: "#fff" }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}
