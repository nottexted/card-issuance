import React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";

export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {value}
          </Typography>
          {hint ? (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
