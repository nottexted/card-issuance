import React from "react";
import { Box, Typography, Breadcrumbs, Link, Stack } from "@mui/material";
import { NavLink } from "react-router-dom";

export default function PageHeader({
  title,
  subtitle,
  crumbs,
  right,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; to?: string }[];
  right?: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
      <Box>
        {crumbs?.length ? (
          <Breadcrumbs sx={{ mb: 0.5 }}>
            {crumbs.map((c, i) =>
              c.to ? (
                <Link key={i} component={NavLink} to={c.to} underline="hover" color="inherit">
                  {c.label}
                </Link>
              ) : (
                <Typography key={i} color="text.secondary">
                  {c.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        ) : null}
        <Typography variant="h5">{title}</Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {right ? <Box sx={{ pt: 0.3 }}>{right}</Box> : null}
    </Stack>
  );
}
