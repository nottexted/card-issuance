import React from "react";
import { Box, Button, Card, CardContent, LinearProgress, Stack, Typography, Chip } from "@mui/material";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cardEvent, listCards } from "../api/queries";
import type { CardRow } from "../api/types";
import { fmtDateTime } from "../utils/format";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { useToast } from "../state/toast";

export default function Cards() {
  const toast = useToast();
  const query = useQuery({ queryKey: ["cards"], queryFn: () => listCards(200, 0) });

  const eventMut = useMutation({
    mutationFn: ({ id, event }: { id: string; event: string }) => cardEvent(id, { event, by: "Оператор" }),
    onSuccess: () => {
      toast.show("Событие применено", "success");
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const rows = query.data?.items ?? [];

  const cols: GridColDef<CardRow>[] = [
    { field: "card_no", headerName: "Карта", width: 160, renderCell: (p) => <Typography sx={{ fontWeight: 900 }}>{p.row.card_no}</Typography> },
    { field: "status", headerName: "Статус", width: 190, sortable: false, renderCell: (p) => <StatusChip code={p.row.status.code} name={p.row.status.name} /> },
    {
      field: "link",
      headerName: "Связи",
      width: 340,
      sortable: false,
      renderCell: (p) => (
        <Stack spacing={0.25}>
          <Typography sx={{ fontWeight: 700 }}>{p.row.client?.full_name || "—"}</Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
            {p.row.application?.application_no ? <Chip size="small" label={`Заявка: ${p.row.application.application_no}`} /> : <Chip size="small" variant="outlined" label="Заявки нет" />}
            {p.row.batch?.batch_no ? <Chip size="small" label={`Партия: ${p.row.batch.batch_no}`} /> : <Chip size="small" variant="outlined" label="Партии нет" />}
          </Stack>
        </Stack>
      ),
    },
    { field: "pan_masked", headerName: "PAN (masked)", width: 140, renderCell: (p) => <Typography>{p.row.pan_masked || "—"}</Typography> },
    {
      field: "expiry",
      headerName: "Срок",
      width: 110,
      sortable: false,
      renderCell: (p) => <Typography>{p.row.expiry_month && p.row.expiry_year ? `${p.row.expiry_month}/${p.row.expiry_year}` : "—"}</Typography>,
    },
    { field: "issued_at", headerName: "Выпущена", width: 170, renderCell: (p) => <Typography>{fmtDateTime(p.row.issued_at)}</Typography> },
    { field: "delivered_at", headerName: "Доставлена", width: 170, renderCell: (p) => <Typography>{fmtDateTime(p.row.delivered_at)}</Typography> },
    { field: "handed_at", headerName: "Выдана", width: 170, renderCell: (p) => <Typography>{fmtDateTime(p.row.handed_at)}</Typography> },
    { field: "activated_at", headerName: "Активирована", width: 170, renderCell: (p) => <Typography>{fmtDateTime(p.row.activated_at)}</Typography> },
    {
      field: "actions",
      headerName: "",
      width: 420,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => eventMut.mutate({ id: p.row.id, event: "issued" })}
            disabled={p.row.status.code !== "CREATED"}
          >
            Выпустить
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LocalShippingIcon />}
            onClick={() => eventMut.mutate({ id: p.row.id, event: "delivered" })}
            disabled={p.row.status.code !== "ISSUED"}
          >
            Доставить
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<DoneAllIcon />}
            onClick={() => eventMut.mutate({ id: p.row.id, event: "handed" })}
            disabled={p.row.status.code !== "DELIVERED"}
          >
            Выдать
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<HowToRegIcon />}
            onClick={() => eventMut.mutate({ id: p.row.id, event: "activated" })}
            disabled={p.row.status.code !== "HANDED"}
          >
            Активировать
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Карты" subtitle="Жизненный цикл карты + явные связи с заявкой и партией эмиссии." />

      <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
        <CardContent>
          {query.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}
          <div style={{ height: 620, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={cols}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              rowHeight={72}
              sx={{
                border: "1px solid #eef1f7",
                borderRadius: 2,
                background: "#fff",
                "& .MuiDataGrid-columnHeaders": { background: "#fafbff" },
                "& .MuiDataGrid-cell": { py: 1, alignItems: "center" },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}
