import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PageHeader from "../components/PageHeader";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createClient, listClients, updateClient } from "../api/queries";
import type { Client } from "../api/types";
import { fmtDateTime } from "../utils/format";
import { useToast } from "../state/toast";

export default function Clients() {
  const toast = useToast();
  const [q, setQ] = React.useState("");
  const query = useQuery({ queryKey: ["clients", q], queryFn: () => listClients(q, 100, 0) });

  const [dlg, setDlg] = React.useState<{ open: boolean; row?: Client }>({ open: false });

  const createMut = useMutation({
    mutationFn: (p: any) => createClient(p),
    onSuccess: () => {
      toast.show("Клиент создан", "success");
      setDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: any }) => updateClient(id, p),
    onSuccess: () => {
      toast.show("Клиент обновлён", "success");
      setDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const rows = query.data?.items ?? [];

  const cols: GridColDef<Client>[] = [
    {
      field: "full_name",
      headerName: "ФИО",
      width: 280,
      renderCell: (p) => <Typography sx={{ fontWeight: 800 }}>{p.row.full_name}</Typography>,
    },
    {
      field: "phone",
      headerName: "Телефон",
      width: 160,
      renderCell: (p) => <Typography>{p.row.phone || "—"}</Typography>,
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      renderCell: (p) => <Typography>{p.row.email || "—"}</Typography>,
    },
    {
      field: "doc_number",
      headerName: "Документ",
      width: 180,
      renderCell: (p) => <Typography>{p.row.doc_number || "—"}</Typography>,
    },
    {
      field: "segment",
      headerName: "Сегмент",
      width: 130,
      renderCell: (p) => <Typography>{p.row.segment || "—"}</Typography>,
    },
    {
      field: "kyc_status",
      headerName: "KYC",
      width: 110,
      renderCell: (p) => <Typography>{p.row.kyc_status || "—"}</Typography>,
    },
    {
      field: "created_at",
      headerName: "Создан",
      width: 170,
      renderCell: (p) => <Typography>{fmtDateTime(p.row.created_at)}</Typography>,
    },
    {
      field: "actions",
      headerName: "",
      width: 140,
      sortable: false,
      renderCell: (p) => (
        <Button size="small" variant="outlined" onClick={() => setDlg({ open: true, row: p.row })}>
          Редактировать
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Клиенты"
        subtitle="Расширенная карточка клиента: документы, адреса, сегменты, KYC."
        right={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({ open: true })}>
            Новый клиент
          </Button>
        }
      />

      <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
            <TextField size="small" value={q} onChange={(e) => setQ(e.target.value)} label="Поиск" placeholder="ФИО" sx={{ minWidth: 280 }} />
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Чтобы использовать в заявке — кликни по строке: Client ID скопируется в буфер.
            </Typography>
          </Stack>

          {query.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

          <div style={{ height: 620, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={cols}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              onRowClick={(p) => {
                navigator.clipboard.writeText(p.row.id);
                toast.show("Client ID скопирован в буфер", "info");
              }}
              sx={{ border: "1px solid #eef1f7", borderRadius: 2, background: "#fff", "& .MuiDataGrid-columnHeaders": { background: "#fafbff" } }}
            />
          </div>
        </CardContent>
      </Card>

      <ClientDialog
        open={dlg.open}
        row={dlg.row}
        onClose={() => setDlg({ open: false })}
        onSubmit={(p) => (dlg.row ? updateMut.mutate({ id: dlg.row.id, p }) : createMut.mutate(p))}
        busy={createMut.isPending || updateMut.isPending}
      />
    </Box>
  );
}

function ClientDialog({
  open,
  row,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  row?: Client;
  onClose: () => void;
  onSubmit: (p: any) => void;
  busy: boolean;
}) {
  const [p, setP] = React.useState<any>({
    full_name: "",
    phone: "",
    email: "",
    birth_date: "",
    gender: "",
    citizenship: "",
    doc_type: "Паспорт",
    doc_number: "",
    doc_issue_date: "",
    doc_issuer: "",
    reg_address: "",
    fact_address: "",
    segment: "mass",
    kyc_status: "new",
    risk_level: "low",
    note: "",
  });

  React.useEffect(() => {
    if (!open) return;
    if (row) {
      setP({
        ...p,
        ...row,
        birth_date: row.birth_date || "",
        doc_issue_date: row.doc_issue_date || "",
      });
    } else {
      setP({
        full_name: "",
        phone: "",
        email: "",
        birth_date: "",
        gender: "",
        citizenship: "",
        doc_type: "Паспорт",
        doc_number: "",
        doc_issue_date: "",
        doc_issuer: "",
        reg_address: "",
        fact_address: "",
        segment: "mass",
        kyc_status: "new",
        risk_level: "low",
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, row?.id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {row ? "Редактирование клиента" : "Новый клиент"}
        {row ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            ID: {row.id}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="ФИО" size="small" fullWidth value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
            <TextField label="Телефон" size="small" fullWidth value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Email" size="small" fullWidth value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
            <TextField label="Дата рождения" size="small" fullWidth value={p.birth_date} onChange={(e) => setP({ ...p, birth_date: e.target.value })} placeholder="YYYY-MM-DD" />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Тип документа" size="small" fullWidth value={p.doc_type} onChange={(e) => setP({ ...p, doc_type: e.target.value })} />
            <TextField label="Номер документа" size="small" fullWidth value={p.doc_number} onChange={(e) => setP({ ...p, doc_number: e.target.value })} />
          </Stack>

          <TextField label="Кем выдан" size="small" value={p.doc_issuer} onChange={(e) => setP({ ...p, doc_issuer: e.target.value })} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Адрес регистрации" size="small" fullWidth value={p.reg_address} onChange={(e) => setP({ ...p, reg_address: e.target.value })} />
            <TextField label="Адрес фактический" size="small" fullWidth value={p.fact_address} onChange={(e) => setP({ ...p, fact_address: e.target.value })} />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select label="Сегмент" size="small" fullWidth value={p.segment} onChange={(e) => setP({ ...p, segment: e.target.value })}>
              <MenuItem value="mass">Mass</MenuItem>
              <MenuItem value="affluent">Affluent</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
            </TextField>
            <TextField select label="KYC" size="small" fullWidth value={p.kyc_status} onChange={(e) => setP({ ...p, kyc_status: e.target.value })}>
              <MenuItem value="new">new</MenuItem>
              <MenuItem value="verified">verified</MenuItem>
              <MenuItem value="failed">failed</MenuItem>
            </TextField>
            <TextField select label="Риск" size="small" fullWidth value={p.risk_level} onChange={(e) => setP({ ...p, risk_level: e.target.value })}>
              <MenuItem value="low">low</MenuItem>
              <MenuItem value="medium">medium</MenuItem>
              <MenuItem value="high">high</MenuItem>
            </TextField>
          </Stack>

          <TextField label="Примечание" size="small" multiline minRows={3} value={p.note} onChange={(e) => setP({ ...p, note: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Отмена
        </Button>
        <Button onClick={() => onSubmit(p)} variant="contained" disabled={busy || !p.full_name}>
          {busy ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
