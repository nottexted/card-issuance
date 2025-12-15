import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import { DataGrid, GridColDef, GridToolbarContainer } from "@mui/x-data-grid";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createApplication,
  decideApplication,
  ensureCard,
  getApplication,
  listApplications,
  updateApplication,
} from "../api/queries";
import type { ApplicationRow } from "../api/types";
import { fmtDate, fmtDateTime, money } from "../utils/format";
import { useMeta } from "../state/meta";
import AddIcon from "@mui/icons-material/Add";
import GavelIcon from "@mui/icons-material/Gavel";
import PrintIcon from "@mui/icons-material/Print";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { useToast } from "../state/toast";
import { API_BASE } from "../api/http";

export default function Applications() {
  const { meta } = useMeta();
  const toast = useToast();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("");

  const query = useQuery({
    queryKey: ["applications", q, status],
    queryFn: () =>
      listApplications({
        q: q || undefined,
        statuses: status ? [status] : undefined,
        limit: 100,
        offset: 0,
      }),
  });

  const [formDlg, setFormDlg] = React.useState<{ open: boolean; row?: ApplicationRow }>({ open: false });
  const [decisionOpen, setDecisionOpen] = React.useState<{ open: boolean; row?: ApplicationRow }>({ open: false });
  const [details, setDetails] = React.useState<{ open: boolean; id?: string }>({ open: false });

  const createMut = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      toast.show("Заявка создана", "success");
      setFormDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateApplication(id, payload),
    onSuccess: () => {
      toast.show("Заявка обновлена", "success");
      setFormDlg({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const decideMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => decideApplication(id, payload),
    onSuccess: () => {
      toast.show("Решение сохранено", "success");
      setDecisionOpen({ open: false });
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const ensureMut = useMutation({
    mutationFn: (id: string) => ensureCard(id),
    onSuccess: (r) => {
      toast.show(`Карта создана: ${r.card_no}`, "success");
      query.refetch();
    },
    onError: (e: any) => toast.show(e.message, "error"),
  });

  const rows = query.data?.items ?? [];

  const columns: GridColDef<ApplicationRow>[] = [
    {
      field: "application_no",
      headerName: "Заявка",
      width: 150,
      renderCell: (p) => <Typography sx={{ fontWeight: 900 }}>{p.row.application_no}</Typography>,
    },
    {
      field: "status",
      headerName: "Статус",
      width: 180,
      sortable: false,
      renderCell: (p) => <StatusChip code={p.row.status?.code || "—"} name={p.row.status?.name || p.row.status?.code} />,
    },
    {
      field: "client",
      headerName: "Клиент",
      width: 260,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontWeight: 800 }}>{p.row.client?.full_name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {(p.row.client?.phone || "—") + " • " + (p.row.client?.doc_number || "—")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "product",
      headerName: "Продукт",
      width: 220,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontWeight: 800 }}>{p.row.product?.name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {(p.row.product?.payment_system || "—") + " • " + (p.row.product?.level || "—") + " • " + (p.row.product?.currency || "—")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tariff",
      headerName: "Тариф",
      width: 210,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontWeight: 800 }}>{p.row.tariff?.name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            Выпуск {money(p.row.tariff?.issue_fee ?? 0)} • {money(p.row.tariff?.monthly_fee ?? 0)}/мес
          </Typography>
        </Box>
      ),
    },
    {
      field: "branch",
      headerName: "Офис",
      width: 220,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography sx={{ fontWeight: 800 }}>{p.row.branch?.name || "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {p.row.branch?.city || "—"}
          </Typography>
        </Box>
      ),
    },
    { field: "requested_at", headerName: "Создана", width: 170, renderCell: (p) => <Typography>{fmtDateTime(p.row.requested_at)}</Typography> },
    { field: "planned_issue_date", headerName: "План выпуска", width: 140, renderCell: (p) => <Typography>{fmtDate(p.row.planned_issue_date)}</Typography> },
    {
      field: "actions",
      headerName: "",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="Подробности">
            <IconButton onClick={() => setDetails({ open: true, id: p.row.id })} size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Редактировать">
            <IconButton onClick={() => setFormDlg({ open: true, row: p.row })} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Решение (одобрить/отказать)">
            <IconButton onClick={() => setDecisionOpen({ open: true, row: p.row })} size="small">
              <GavelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Создать карту по заявке">
            <span>
              <IconButton
                onClick={() => ensureMut.mutate(p.row.id)}
                size="small"
                disabled={!["APPROVED", "IN_BATCH"].includes(p.row.status?.code || "")}
              >
                <CreditCardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Печать заявления (PDF)">
            <IconButton onClick={() => window.open(`${API_BASE}/api/applications/${p.row.id}/print/statement`, "_blank")} size="small">
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Печать: Договор‑оферта на выпуск и обслуживание платежной карты (PDF)">
            <IconButton onClick={() => window.open(`${API_BASE}/api/applications/${p.row.id}/print/contract`, "_blank")} size="small">
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>

        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Заявки на выпуск"
        subtitle="Полный цикл: создание, KYC/решение, выпуск, печать документов."
        right={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormDlg({ open: true })}>
            Новая заявка
          </Button>
        }
      />

      <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 1.5 }}>
            <TextField size="small" value={q} onChange={(e) => setQ(e.target.value)} label="Поиск" placeholder="APP-..., ФИО, паспорт" sx={{ minWidth: 280 }} />
            <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value)} label="Статус" sx={{ minWidth: 220 }}>
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="NEW">Новые</MenuItem>
              <MenuItem value="IN_REVIEW">На проверке</MenuItem>
              <MenuItem value="APPROVED">Одобрены</MenuItem>
              <MenuItem value="IN_BATCH">В партии</MenuItem>
              <MenuItem value="REJECTED">Отказы</MenuItem>
            </TextField>
            <Box sx={{ flex: 1 }} />
            <Chip label={`Найдено: ${query.data?.meta.total ?? 0}`} sx={{ fontWeight: 800 }} />
          </Stack>

          {query.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

          <div style={{ height: 680, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.id}
              disableRowSelectionOnClick
              density="comfortable"
              pageSizeOptions={[50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 50, page: 0 } } }}
              getRowHeight={() => "auto"}
              sx={{
                border: "1px solid #eef1f7",
                borderRadius: 2,
                background: "#fff",
                "& .MuiDataGrid-columnHeaders": { background: "#fafbff" },
                "& .MuiDataGrid-cell": { py: 1, alignItems: "flex-start" },
                "& .MuiDataGrid-row": { maxHeight: "none !important" },
              }}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { onRefresh: () => query.refetch() } as any }}
            />
          </div>
        </CardContent>
      </Card>

      <ApplicationFormDialog
        open={formDlg.open}
        row={formDlg.row}
        meta={meta}
        busy={createMut.isPending || updateMut.isPending}
        onClose={() => setFormDlg({ open: false })}
        onSubmit={(payload) => (formDlg.row ? updateMut.mutate({ id: formDlg.row.id, payload }) : createMut.mutate(payload))}
      />

      <DecisionDialog
        open={decisionOpen.open}
        row={decisionOpen.row}
        onClose={() => setDecisionOpen({ open: false })}
        meta={meta}
        busy={decideMut.isPending}
        onSubmit={(id, payload) => decideMut.mutate({ id, payload })}
      />

      <ApplicationDrawer open={details.open} id={details.id} onClose={() => setDetails({ open: false })} onEdit={(row) => setFormDlg({ open: true, row })} />
    </Box>
  );
}

function GridToolbar({ onRefresh }: { onRefresh: () => void }) {
  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between", px: 1, py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
        Реестр заявок
      </Typography>
      <Button size="small" onClick={onRefresh} variant="outlined">
        Обновить
      </Button>
    </GridToolbarContainer>
  );
}

function ApplicationDrawer({ open, id, onClose, onEdit }: { open: boolean; id?: string; onClose: () => void; onEdit: (row: ApplicationRow) => void }) {
  const toast = useToast();

  const q = useQuery({
    queryKey: ["application", id],
    queryFn: () => (id ? getApplication(id) : Promise.resolve(null as any)),
    enabled: !!id && open,
  });

  const row = q.data as any as ApplicationRow | null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 560, p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, flex: 1 }}>
            {row?.application_no || "Заявка"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {q.isLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

        {!row ? (
          <Typography variant="body2" color="text.secondary">
            Нет данных.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <StatusChip code={row.status.code} name={row.status.name} />
              {row.batch?.batch_no ? <Chip label={`Партия: ${row.batch.batch_no}`} /> : <Chip label="Вне партии" variant="outlined" />}
              {row.card?.card_no ? <Chip label={`Карта: ${row.card.card_no}`} /> : <Chip label="Карты нет" variant="outlined" />}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit(row)}>
                Редактировать
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.open(`${API_BASE}/api/applications/${row.id}/print/statement`, "_blank")}
              >
                PDF заявление
              </Button>
            </Stack>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Клиент
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>{row.client?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {(row.client?.phone || "—") + " • " + (row.client?.email || "—")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Документ: {(row.client?.doc_type || "—") + " " + (row.client?.doc_number || "—")}
            </Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Параметры заявки
            </Typography>
            <Typography variant="body2">Продукт: <b>{row.product?.name}</b></Typography>
            <Typography variant="body2">Тариф: <b>{row.tariff?.name}</b></Typography>
            <Typography variant="body2">Канал: <b>{row.channel?.name}</b></Typography>
            <Typography variant="body2">Офис: <b>{row.branch?.city}</b> • {row.branch?.name}</Typography>
            <Typography variant="body2">Доставка: <b>{row.delivery?.name}</b></Typography>
            <Typography variant="body2">Адрес: {row.delivery_address || "—"}</Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Таймлайн
            </Typography>
            <Typography variant="body2">Создана: {fmtDateTime(row.requested_at)}</Typography>
            <Typography variant="body2">План выпуска: {fmtDate(row.planned_issue_date)}</Typography>
            <Typography variant="body2">План доставки: {fmtDate(row.requested_delivery_date)}</Typography>

            <Divider />

            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              KYC / решение
            </Typography>
            <Typography variant="body2">KYC score: {row.kyc_score ?? "—"}</Typography>
            <Typography variant="body2">KYC result: {row.kyc_result ?? "—"}</Typography>
            <Typography variant="body2">Решение: {row.decision_at ? `${fmtDateTime(row.decision_at)} • ${row.decision_by || "—"}` : "—"}</Typography>

            {row.reject_reason?.name ? (
              <Typography variant="body2" color="error">
                Причина отказа: {row.reject_reason.name}
              </Typography>
            ) : null}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

function ApplicationFormDialog({
  open,
  row,
  meta,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  row?: ApplicationRow;
  meta: any;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  busy: boolean;
}) {
  const { refs } = meta || { refs: null };

  const init = React.useCallback(() => {
    if (!row) {
      return {
        client_id: "",
        product_id: "",
        tariff_id: "",
        channel_id: "",
        branch_id: "",
        delivery_method_id: "",
        delivery_address: "",
        delivery_comment: "",
        embossing_name: "",
        is_salary_project: false,
        requested_delivery_date: "",
        priority: "normal",
        limits_requested_json: {},
        consent_personal_data: true,
        consent_marketing: false,
        comment: "",
      };
    }
    return {
      client_id: row.client?.id || "",
      product_id: String(row.product?.id ?? ""),
      tariff_id: String(row.tariff?.id ?? ""),
      channel_id: String(row.channel?.id ?? ""),
      branch_id: String(row.branch?.id ?? ""),
      delivery_method_id: String(row.delivery?.id ?? ""),
      delivery_address: row.delivery_address ?? "",
      delivery_comment: row.delivery_comment ?? "",
      embossing_name: row.embossing_name ?? "",
      is_salary_project: row.is_salary_project ?? false,
      requested_delivery_date: row.requested_delivery_date ?? "",
      priority: row.priority ?? "normal",
      limits_requested_json: {},
      consent_personal_data: true,
      consent_marketing: false,
      comment: row.comment ?? "",
    };
  }, [row]);

  const [payload, setPayload] = React.useState<any>(init);

  React.useEffect(() => {
    if (!open) return;
    setPayload(init());
  }, [open, init]);

  const disabled =
    !payload.client_id ||
    !payload.product_id ||
    !payload.tariff_id ||
    !payload.channel_id ||
    !payload.branch_id ||
    !payload.delivery_method_id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {row ? "Редактирование заявки" : "Новая заявка"}
        {row ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {row.application_no}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <TextField
            value={payload.client_id}
            onChange={(e) => setPayload({ ...payload, client_id: e.target.value })}
            label="Client ID (UUID)"
            placeholder="Клик по строке в «Клиенты» копирует ID"
            size="small"
          />

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select label="Продукт" size="small" fullWidth value={payload.product_id} onChange={(e) => setPayload({ ...payload, product_id: e.target.value })}>
              {refs?.products?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name} • {x.payment_system}/{x.level}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Тариф" size="small" fullWidth value={payload.tariff_id} onChange={(e) => setPayload({ ...payload, tariff_id: e.target.value })}>
              {refs?.tariffs?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select label="Канал" size="small" fullWidth value={payload.channel_id} onChange={(e) => setPayload({ ...payload, channel_id: e.target.value })}>
              {refs?.channels?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Офис" size="small" fullWidth value={payload.branch_id} onChange={(e) => setPayload({ ...payload, branch_id: e.target.value })}>
              {refs?.branches?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.city} • {x.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select label="Доставка" size="small" fullWidth value={payload.delivery_method_id} onChange={(e) => setPayload({ ...payload, delivery_method_id: e.target.value })}>
              {refs?.delivery_methods?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Адрес доставки" size="small" fullWidth value={payload.delivery_address} onChange={(e) => setPayload({ ...payload, delivery_address: e.target.value })} />
          </Stack>

          <TextField label="Комментарий к доставке" size="small" value={payload.delivery_comment} onChange={(e) => setPayload({ ...payload, delivery_comment: e.target.value })} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Имя на карте (embossing)" size="small" fullWidth value={payload.embossing_name} onChange={(e) => setPayload({ ...payload, embossing_name: e.target.value })} />
            <TextField select label="Приоритет" size="small" fullWidth value={payload.priority} onChange={(e) => setPayload({ ...payload, priority: e.target.value })}>
              <MenuItem value="low">Низкий</MenuItem>
              <MenuItem value="normal">Обычный</MenuItem>
              <MenuItem value="high">Высокий</MenuItem>
            </TextField>
          </Stack>

          <TextField
            label="План доставки (YYYY-MM-DD)"
            size="small"
            value={payload.requested_delivery_date}
            onChange={(e) => setPayload({ ...payload, requested_delivery_date: e.target.value })}
            placeholder="YYYY-MM-DD"
          />

          <TextField label="Комментарий" size="small" multiline minRows={3} value={payload.comment} onChange={(e) => setPayload({ ...payload, comment: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Отмена
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              ...payload,
              product_id: Number(payload.product_id),
              tariff_id: Number(payload.tariff_id),
              channel_id: Number(payload.channel_id),
              branch_id: Number(payload.branch_id),
              delivery_method_id: Number(payload.delivery_method_id),
            })
          }
          variant="contained"
          disabled={busy || disabled}
        >
          {busy ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DecisionDialog({
  open,
  row,
  onClose,
  meta,
  onSubmit,
  busy,
}: {
  open: boolean;
  row?: ApplicationRow;
  onClose: () => void;
  meta: any;
  onSubmit: (id: string, payload: any) => void;
  busy: boolean;
}) {
  const { refs } = meta || { refs: null };
  const [decision, setDecision] = React.useState<"approve" | "reject">("approve");
  const [plannedIssue, setPlannedIssue] = React.useState<string>("");
  const [kycScore, setKycScore] = React.useState<number | "">("");
  const [kycResult, setKycResult] = React.useState<string>("pass");
  const [kycNotes, setKycNotes] = React.useState<string>("");
  const [rejectReason, setRejectReason] = React.useState<string>("");

  React.useEffect(() => {
    if (!open || !row) return;
    setDecision("approve");
    setPlannedIssue(row.planned_issue_date || "");
    setKycScore((row.kyc_score ?? "") as any);
    setKycResult(row.kyc_result || "pass");
    setKycNotes("");
    setRejectReason("");
  }, [open, row?.id]);

  const disabled = decision === "reject" && !rejectReason;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Решение по заявке
        {row ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {row.application_no} • {row.client?.full_name || "—"}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField select label="Решение" size="small" fullWidth value={decision} onChange={(e) => setDecision(e.target.value as any)}>
              <MenuItem value="approve">Одобрить</MenuItem>
              <MenuItem value="reject">Отказать</MenuItem>
            </TextField>
            <TextField label="Плановая дата выпуска" size="small" fullWidth value={plannedIssue} onChange={(e) => setPlannedIssue(e.target.value)} placeholder="YYYY-MM-DD" />
          </Stack>

          {decision === "reject" ? (
            <TextField select label="Причина отказа" size="small" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} fullWidth>
              {refs?.reject_reasons?.map((x: any) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            KYC / скоринг
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="KYC score" size="small" type="number" fullWidth value={kycScore} onChange={(e) => setKycScore(e.target.value === "" ? "" : Number(e.target.value))} />
            <TextField select label="KYC result" size="small" fullWidth value={kycResult} onChange={(e) => setKycResult(e.target.value)}>
              <MenuItem value="pass">pass</MenuItem>
              <MenuItem value="fail">fail</MenuItem>
              <MenuItem value="manual">manual</MenuItem>
            </TextField>
          </Stack>

          <TextField label="Заметки KYC" size="small" multiline minRows={3} value={kycNotes} onChange={(e) => setKycNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Отмена
        </Button>
        <Button
          onClick={() =>
            row &&
            onSubmit(row.id, {
              decision,
              planned_issue_date: plannedIssue || null,
              kyc_score: kycScore === "" ? null : Number(kycScore),
              kyc_result: kycResult || null,
              kyc_notes: kycNotes || null,
              reject_reason_id: decision === "reject" ? Number(rejectReason) : null,
              decision_by: "Оператор",
            })
          }
          variant="contained"
          disabled={busy || disabled || !row}
        >
          {busy ? "Сохранение..." : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
