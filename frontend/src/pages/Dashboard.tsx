import React from "react";
import { Box, Card, CardContent, Grid, Stack, Typography, LinearProgress } from "@mui/material";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { reportFunnel, reportVolume } from "../api/queries";
import ReactECharts from "echarts-for-react";

export default function Dashboard() {
  const funnelQ = useQuery({ queryKey: ["funnel"], queryFn: () => reportFunnel({}) });
  const volumeQ = useQuery({ queryKey: ["volume"], queryFn: () => reportVolume({ bucket: "day" }) });

  const funnel = funnelQ.data;
  const volume = volumeQ.data?.points ?? [];

  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Заявки", "Одобрено", "Выпущено", "Активировано"] },
    grid: { left: 48, right: 16, top: 36, bottom: 40 },
    xAxis: { type: "category", data: volume.map((p) => p.bucket) },
    yAxis: { type: "value" },
    series: [
      { name: "Заявки", type: "line", smooth: true, data: volume.map((p) => p.applications) },
      { name: "Одобрено", type: "line", smooth: true, data: volume.map((p) => p.approved) },
      { name: "Выпущено", type: "line", smooth: true, data: volume.map((p) => p.issued) },
      { name: "Активировано", type: "line", smooth: true, data: volume.map((p) => p.activated) },
    ],
  };

  return (
    <Box>
      <PageHeader
        title="Дашборд"
        subtitle="Ключевые показатели эмиссии и динамика за последние периоды."
      />

      {(funnelQ.isLoading || volumeQ.isLoading) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <Grid item xs={12} md={2.4 as any}>
          <StatCard label="Заявки" value={funnel?.applications ?? "—"} hint="Последние 30 дней" />
        </Grid>
        <Grid item xs={12} md={2.4 as any}>
          <StatCard label="Одобрено" value={funnel?.approved ?? "—"} hint="С учетом «в партии»" />
        </Grid>
        <Grid item xs={12} md={2.4 as any}>
          <StatCard label="Отказы" value={funnel?.rejected ?? "—"} hint="Последние 30 дней" />
        </Grid>
        <Grid item xs={12} md={2.4 as any}>
          <StatCard label="Выпущено" value={funnel?.issued ?? "—"} hint="Есть issued_at" />
        </Grid>
        <Grid item xs={12} md={2.4 as any}>
          <StatCard label="Активировано" value={funnel?.activated ?? "—"} hint="Есть activated_at" />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Typography variant="h6">Динамика</Typography>
                <Typography variant="caption" color="text.secondary">
                  Показатели по дням (90 дней)
                </Typography>
              </Stack>
              <ReactECharts option={option} style={{ height: 360 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
            <CardContent>
              <Typography variant="h6">Воронка эмиссии</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Прогресс от заявки до активации
              </Typography>

              <Box sx={{ mt: 2 }}>
                <ProgressRow label="Заявки" value={funnel?.applications ?? 0} max={funnel?.applications ?? 0} />
                <ProgressRow label="Одобрено" value={funnel?.approved ?? 0} max={funnel?.applications ?? 0} />
                <ProgressRow label="Выпущено" value={funnel?.issued ?? 0} max={funnel?.applications ?? 0} />
                <ProgressRow label="Выдано" value={funnel?.handed ?? 0} max={funnel?.applications ?? 0} />
                <ProgressRow label="Активировано" value={funnel?.activated ?? 0} max={funnel?.applications ?? 0} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <Box sx={{ mb: 1.4 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {value} • {pct}%
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 2 }} />
    </Box>
  );
}
