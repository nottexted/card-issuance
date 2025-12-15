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
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import PostAddIcon from "@mui/icons-material/PostAdd";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addBatchItems,
  createBatch,
  getBatch,
  issueBatchCards,
  listApplications,
  listBatches,
  setBatchStatus,
  updateBatch,
} from "../api/queries";
import type { BatchRow, ApplicationRow } from "../api/types";
import { fmtDateTime } from "../utils/format";
import { useMeta } from "../state/meta";
import { useToast } from "../state/toast";

export default function Batches() {
  const { meta } = useMeta();
  const toast = useToast();

  const query = useQuery({ queryKey: ["batches"], queryFn: () => listBatches(100, 0) });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [itemsDlg, setItemsDlg] = React.useState<{ open: boolean; batch?: BatchRow }>({ open: false });
  const [editDlg, setEditDlg] = React.useState<{ open: boolean; batch?: BatchRow }>({ open: false });
  const [details, setDetails] = React.useState<{ open: boolean; id?: string }>({ open: false });

  const createMut = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      toast.show("Партия создана", "success");
      setCreateOpen(false);
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const addMut = useMutation({
    mutationFn: ({ batchId, appIds }: { batchId: string; appIds: string[] }) => addBatchItems(batchId, appIds),
    onSuccess: () => {
      toast.show("Заявки добавлены в партию", "success");
      setItemsDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const statusMut = useMutation({
    mutationFn: ({ batchId, status }: { batchId: string; status: string }) => setBatchStatus(batchId, status),
    onSuccess: () => {
      toast.show("Статус партии обновлён", "success");
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateBatch(id, payload),
    onSuccess: () => {
      toast.show("Партия обновлена", "success");
      setEditDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const issueMut = useMutation({
    mutationFn: (id: string) => issueBatchCards(id),
    onSuccess: (r) => {
      toast.show(`Выпуск выполнен: создано ${r.created}, выпущено ${r.issued}`, "success");
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const rows = query.data?.items ?? [];

  const cols: GridColDef<BatchRow>[] = [
    { field: "batch_no", headerName: "Партия", width: 170, renderCell: (p) => <Typography sx={{ fontWeight: 900 }}>{p.row.batch_no}</Typography> },
    { field: "status", headerName: "Статус", width: 190, renderCell: (p) => <StatusChip code={p.row.status.code} name={p.row.status.name} /> },
    {
      field: "vendor",
      headerName: "Подрядчик",
      width: 300,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontWeight: 800 }}>{p.row.vendor.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row.vendor.vendor_type} • SLA {p.row.vendor.sla_days} дн.
          </Typography>
        </Box>
      ),
    },
    { field: "planned_send_at", headerName: "План отправки", width: 180, renderCell: (p) => fmtDateTime(p.row.planned_send_at) },
    { field: "sent_at", headerName: "Отправлена", width: 180, renderCell: (p) => fmtDateTime(p.row.sent_at) },
    { field: "received_at", headerName: "Получена", width: 180, renderCell: (p) => fmtDateTime(p.row.received_at) },
    {
      field: "actions",
      headerName: "",
      width: 360,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Подробности">
            <IconButton onClick={() => setDetails({ open: true, id: p.row.id })} size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Редактировать партию">
            <IconButton onClick={() => setEditDlg({ open: true, batch: p.row })} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button size="small" variant="outlined" startIcon={<PostAddIcon />} onClick={() => setItemsDlg({ open: true, batch: p.row })}>
            Добавить заявки
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => statusMut.mutate({ batchId: p.row.id, status: p.row.status.code === "CREATED" ? "SENT" : "RECEIVED" })}
          >
            {p.row.status.code === "CREATED" ? "Отправить" : "Получить"}
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Партии эмиссии"
        subtitle="Формирование партии, отправка на производство, получение, выпуск карт и дальнейшая логистика."
        right={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Новая партия
          </Button>
        }
      />

      <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
        <CardContent>
          {query.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}
          <div style={{ height: 650, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={cols}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              density="comfortable"
              rowHeight={64}
              sx={{
                border: "1px solid #eef1f7",
                borderRadius: 2,
                background: "#fff",
                "& .MuiDataGrid-columnHeaders": { background: "#fafbff" },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <CreateBatchDialog open={createOpen} onClose={() => setCreateOpen(false)} meta={meta} busy={createMut.isPending} onSubmit={(payload) => createMut.mutate(payload)} />

      <AddItemsDialog open={itemsDlg.open} onClose={() => setItemsDlg({ open: false })} batch={itemsDlg.batch} busy={addMut.isPending} onSubmit={(ids) => itemsDlg.batch && addMut.mutate({ batchId: itemsDlg.batch.id, appIds: ids })} />

      <BatchEditDialog
        open={editDlg.open}
        onClose={() => setEditDlg({ open: false })}
        batch={editDlg.batch}
        meta={meta}
        busy={updateMut.isPending}
        onSubmit={(payload) => editDlg.batch && updateMut.mutate({ id: editDlg.batch.id, payload })}
      />

      <BatchDrawer open={details.open} id={details.id} onClose={() => setDetails({ open: false })} onIssue={(id) => issueMut.mutate(id)} issuing={issueMut.isPending} />
    </Box>
  );
}

function CreateBatchDialog({ open, onClose, meta, onSubmit, busy }: { open: boolean; onClose: () => void; meta: any; onSubmit: (payload: any) => void; busy: boolean }) {
  const { refs } = meta || { refs: null };
  const [vendorId, setVendorId] = React.useState<string>("");
  const [plannedSendAt, setPlannedSendAt] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) return;
    setVendorId(refs?.vendors?.[0]?.id ? String(refs.vendors[0].id) : "");
    setPlannedSendAt("");
  }, [open, refs?.vendors?.length]);

  const disabled = !vendorId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>Новая партия</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <TextField select label="Подрядчик" size="small" value={vendorId} onChange={(e) => setVendorId(e.target.value)} fullWidth>
            {refs?.vendors?.map((x: any) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name} • {x.vendor_type} • SLA {x.sla_days} дн.
              </MenuItem>
            ))}
          </TextField>
          <TextField label="План отправки (datetime)" size="small" value={plannedSendAt} onChange={(e) => setPlannedSendAt(e.target.value)} placeholder="YYYY-MM-DDTHH:mm:ssZ или пусто" />
          <Typography variant="caption" color="text.secondary">
            Можно оставить пустым — система подставит автоматически.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Отмена</Button>
        <Button onClick={() => onSubmit({ vendor_id: Number(vendorId), planned_send_at: plannedSendAt || null })} variant="contained" disabled={busy || disabled}>
          {busy ? "Создание..." : "Создать"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BatchEditDialog({ open, onClose, batch, meta, onSubmit, busy }: { open: boolean; onClose: () => void; batch?: BatchRow; meta: any; onSubmit: (payload: any) => void; busy: boolean }) {
  const { refs } = meta || { refs: null };
  const [vendorId, setVendorId] = React.useState<string>("");
  const [plannedSendAt, setPlannedSendAt] = React.useState<string>("");

  React.useEffect(() => {
    if (!open || !batch) return;
    setVendorId(String(batch.vendor.id));
    setPlannedSendAt(batch.planned_send_at || "");
  }, [open, batch?.id]);

  const disabled = !vendorId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Редактирование партии
        {batch ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {batch.batch_no}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <TextField select label="Подрядчик" size="small" value={vendorId} onChange={(e) => setVendorId(e.target.value)} fullWidth>
            {refs?.vendors?.map((x: any) => (
              <MenuItem key={x.id} value={x.id}>
                {x.name} • {x.vendor_type} • SLA {x.sla_days} дн.
              </MenuItem>
            ))}
          </TextField>
          <TextField label="План отправки (datetime)" size="small" value={plannedSendAt} onChange={(e) => setPlannedSendAt(e.target.value)} placeholder="YYYY-MM-DDTHH:mm:ssZ или пусто" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Отмена</Button>
        <Button onClick={() => onSubmit({ vendor_id: Number(vendorId), planned_send_at: plannedSendAt || null })} variant="contained" disabled={busy || disabled}>
          {busy ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddItemsDialog({
  open,
  onClose,
  batch,
  busy,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  batch?: BatchRow;
  busy: boolean;
  onSubmit: (ids: string[]) => void;
}) {
  const toast = useToast();
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);

  const apps = useQuery({
    queryKey: ["apps-approved", q],
    queryFn: () => listApplications({ q: q || undefined, statuses: ["APPROVED"], limit: 200, offset: 0 }),
    enabled: open,
  });

  React.useEffect(() => {
    if (!open) return;
    setSelected([]);
  }, [open]);

  const rows: ApplicationRow[] = apps.data?.items ?? [];

  const cols: GridColDef<ApplicationRow>[] = [
    { field: "application_no", headerName: "Заявка", width: 170, renderCell: (p) => <Typography sx={{ fontWeight: 900 }}>{p.row.application_no}</Typography> },
    { field: "client", headerName: "Клиент", width: 320, sortable: false, renderCell: (p) => <Typography>{p.row.client?.full_name}</Typography> },
    { field: "product", headerName: "Продукт", width: 220, sortable: false, renderCell: (p) => <Typography>{p.row.product?.name}</Typography> },
    { field: "requested_at", headerName: "Создана", width: 180, renderCell: (p) => fmtDateTime(p.row.requested_at) },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Добавить заявки в партию
        {batch ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {batch.batch_no}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField size="small" value={q} onChange={(e) => setQ(e.target.value)} label="Поиск" placeholder="ФИО/паспорт/номер" sx={{ minWidth: 320 }} />
          <Box sx={{ flex: 1 }} />
          <Chip label={`Выбрано: ${selected.length}`} />
        </Stack>

        {apps.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

        <div style={{ height: 520 }}>
          <DataGrid
            rows={rows}
            columns={cols}
            getRowId={(r) => r.id}
            checkboxSelection
            disableRowSelectionOnClick
            onRowSelectionModelChange={(m) => setSelected(m as string[])}
            rowSelectionModel={selected as any}
            density="comfortable"
            sx={{ border: "1px solid #eef1f7", borderRadius: 2, background: "#fff" }}
          />
        </div>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          В диалог попадают заявки со статусом APPROVED.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Отмена</Button>
        <Button
          onClick={() => {
            if (selected.length === 0) {
              toast.show("Выберите хотя бы одну заявку", "warning");
              return;
            }
            onSubmit(selected);
          }}
          variant="contained"
          disabled={busy || selected.length === 0}
        >
          {busy ? "Добавление..." : "Добавить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BatchDrawer({ open, id, onClose, onIssue, issuing }: { open: boolean; id?: string; onClose: () => void; onIssue: (id: string) => void; issuing: boolean }) {
  const toast = useToast();
  const q = useQuery({
    queryKey: ["batch", id],
    queryFn: () => (id ? getBatch(id) : Promise.resolve(null)),
    enabled: !!id && open,
  });

  const b: any = q.data;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 640, p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
            {b?.batch_no || "Партия"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {q.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

        {!b ? (
          <Typography variant="body2" color="text.secondary">
            Нет данных.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <StatusChip code={b.status.code} name={b.status.name} />
              <Chip label={`Подрядчик: ${b.vendor.name}`} />
              <Chip label={`План: ${fmtDateTime(b.planned_send_at)}`} variant="outlined" />
              <Chip label={`Отправлена: ${fmtDateTime(b.sent_at)}`} variant="outlined" />
              <Chip label={`Получена: ${fmtDateTime(b.received_at)}`} variant="outlined" />
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<LocalPrintshopIcon />}
                onClick={() => {
                  if (!id) return;
                  onIssue(id);
                }}
                disabled={issuing || b.status.code !== "RECEIVED"}
              >
                {issuing ? "Выпуск..." : "Выпустить карты по партии"}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                Доступно после статуса RECEIVED.
              </Typography>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Состав партии
            </Typography>

            <Box sx={{ border: "1px solid #eef1f7", borderRadius: 2, overflow: "hidden" }}>
              {b.items?.length ? (
                b.items.map((it: any, i: number) => {
                  const bg = i % 2 === 0 ? "#ffffff" : "#fbfcff";
                  return (
                    <Box key={it.id} sx={{ p: 1.25, background: bg, borderTop: i === 0 ? "none" : "1px solid #eef1f7" }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 900 }}>{it.application?.application_no}</Typography>
                        <StatusChip code={it.app_status?.code} name={it.app_status?.name} />
                        {it.card?.card_no ? <Chip label={`Карта: ${it.card.card_no}`} size="small" /> : <Chip label="Карты нет" size="small" variant="outlined" />}
                        {it.card?.status?.code ? <StatusChip code={it.card.status.code} name={it.card.status.name} /> : null}
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700 }}>
                        {it.client?.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {it.client?.phone || "—"}
                      </Typography>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ p: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">
                    В партии пока нет заявок.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
