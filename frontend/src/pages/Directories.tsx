import React from "react";
import { Box, Button, Card, CardContent, Divider, Grid, LinearProgress, MenuItem, Stack, TextField, Typography } from "@mui/material";
import PageHeader from "../components/PageHeader";
import { http } from "../api/http";
import { useToast } from "../state/toast";
import { useQueryClient } from "@tanstack/react-query";

type TabKey = "branches" | "channels" | "delivery" | "products" | "tariffs" | "vendors" | "reject";

type Endpoint = { list: string; create: string; update: (id: number) => string };

const endpoints: Record<TabKey, Endpoint> = {
  branches: { list: "/api/ref/branches", create: "/api/ref/branches", update: (id) => `/api/ref/branches/${id}` },
  channels: { list: "/api/ref/channels", create: "/api/ref/channels", update: (id) => `/api/ref/channels/${id}` },
  delivery: { list: "/api/ref/delivery-methods", create: "/api/ref/delivery-methods", update: (id) => `/api/ref/delivery-methods/${id}` },
  products: { list: "/api/ref/products", create: "/api/ref/products", update: (id) => `/api/ref/products/${id}` },
  tariffs: { list: "/api/ref/tariffs", create: "/api/ref/tariffs", update: (id) => `/api/ref/tariffs/${id}` },
  vendors: { list: "/api/ref/vendors", create: "/api/ref/vendors", update: (id) => `/api/ref/vendors/${id}` },
  reject: { list: "/api/ref/reject-reasons", create: "/api/ref/reject-reasons", update: (id) => `/api/ref/reject-reasons/${id}` },
};

function initForm(tab: TabKey) {
  if (tab === "branches") return { code: "", city: "", name: "", address: "", phone: "", is_active: true };
  if (tab === "vendors") return { vendor_type: "manufacturer", name: "", contacts: "", sla_days: 5, is_active: true };
  if (tab === "products") return { code: "", name: "", payment_system: "МИР", level: "Classic", currency: "RUB", term_months: 36, is_virtual: false, is_active: true };
  if (tab === "tariffs") return { code: "", name: "", issue_fee: 0, monthly_fee: 0, cash_withdraw_limit: 0, is_active: true };
  if (tab === "channels") return { code: "", name: "", is_active: true };
  if (tab === "delivery") return { code: "", name: "", is_active: true };
  if (tab === "reject") return { code: "", name: "", is_active: true };
  return { code: "", name: "", is_active: true };
}

export default function Directories() {
  const toast = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = React.useState<TabKey>("products");
  const [items, setItems] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);

  const [editId, setEditId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<any>(() => initForm("products"));

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await http.get(endpoints[tab].list);
      setItems(data.items || []);
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setBusy(false);
    }
  }, [tab, toast]);

  React.useEffect(() => {
    setEditId(null);
    setForm(initForm(tab));
    load();
  }, [tab, load]);

  const isValid = () => {
    if (tab === "branches") return form.code && form.name && form.city && form.address;
    if (tab === "vendors") return form.vendor_type && form.name;
    if (tab === "delivery") return form.code && form.name;
    if (tab === "products") return form.code && form.name && form.payment_system && form.level;
    if (tab === "tariffs") return form.code && form.name;
    return form.code && form.name;
  };

  const normalize = (tab: TabKey, f: any) => {
    const out = { ...f };
    // numbers
    ["sla_days", "term_months", "issue_fee", "monthly_fee", "cash_withdraw_limit"].forEach((k) => {
      if (out[k] !== undefined && out[k] !== null && out[k] !== "") out[k] = Number(out[k]);
    });
    // booleans come as strings sometimes
    if (out.is_virtual === "true") out.is_virtual = true;
    if (out.is_virtual === "false") out.is_virtual = false;
    if (out.is_active === "true") out.is_active = true;
    if (out.is_active === "false") out.is_active = false;
    return out;
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = normalize(tab, form);
      if (editId) {
        await http.put(endpoints[tab].update(editId), payload);
        toast.show("Запись обновлена", "success");
      } else {
        await http.post(endpoints[tab].create, payload);
        toast.show("Запись создана", "success");
      }
      setEditId(null);
      setForm(initForm(tab));
      await load();
      // refresh cached meta (used by forms in Applications/Batches)
      qc.invalidateQueries({ queryKey: ["meta"] });
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (it: any) => {
    setEditId(it.id);
    // put backend-compatible shape into form (remove server-only fields if any)
    const f = { ...initForm(tab), ...it };
    setForm(f);
  };

  const resetNew = () => {
    setEditId(null);
    setForm(initForm(tab));
  };

  return (
    <Box>
      <PageHeader
        title="Справочники"
        subtitle="Удобный ввод и поддержка данных: продукты, тарифы, офисы, каналы, доставка, подрядчики."
        right={
          <TextField select size="small" label="Раздел" value={tab} onChange={(e) => setTab(e.target.value as TabKey)} sx={{ minWidth: 220 }}>
            <MenuItem value="products">Продукты</MenuItem>
            <MenuItem value="tariffs">Тарифы</MenuItem>
            <MenuItem value="branches">Офисы</MenuItem>
            <MenuItem value="channels">Каналы</MenuItem>
            <MenuItem value="delivery">Доставка</MenuItem>
            <MenuItem value="vendors">Подрядчики</MenuItem>
            <MenuItem value="reject">Причины отказа</MenuItem>
          </TextField>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Box>
                  <Typography variant="h6">{editId ? "Редактирование" : "Новая запись"}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {editId ? `ID: ${editId}` : "Заполнение с валидацией — как в коммерческих админках."}
                  </Typography>
                </Box>
                {editId ? (
                  <Button size="small" variant="outlined" onClick={resetNew}>
                    Новая
                  </Button>
                ) : null}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.5}>
                {tab === "vendors" ? (
                  <>
                    <TextField select size="small" label="Тип" value={form.vendor_type} onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}>
                      <MenuItem value="manufacturer">manufacturer</MenuItem>
                      <MenuItem value="courier">courier</MenuItem>
                    </TextField>
                    <TextField size="small" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField size="small" label="Контакты" value={form.contacts} onChange={(e) => setForm({ ...form, contacts: e.target.value })} />
                    <TextField size="small" type="number" label="SLA (дней)" value={form.sla_days} onChange={(e) => setForm({ ...form, sla_days: e.target.value })} />
                    <TextField select size="small" label="Активно" value={String(!!form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <MenuItem value="true">Да</MenuItem>
                      <MenuItem value="false">Нет</MenuItem>
                    </TextField>
                  </>
                ) : tab === "branches" ? (
                  <>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth />
                      <TextField size="small" label="Город" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} fullWidth />
                    </Stack>
                    <TextField size="small" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField size="small" label="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <TextField size="small" label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <TextField select size="small" label="Активно" value={String(!!form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <MenuItem value="true">Да</MenuItem>
                      <MenuItem value="false">Нет</MenuItem>
                    </TextField>
                  </>
                ) : tab === "products" ? (
                  <>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth />
                      <TextField size="small" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Плат. система" value={form.payment_system} onChange={(e) => setForm({ ...form, payment_system: e.target.value })} fullWidth />
                      <TextField size="small" label="Уровень" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} fullWidth />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Валюта" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} fullWidth />
                      <TextField size="small" type="number" label="Срок (мес)" value={form.term_months} onChange={(e) => setForm({ ...form, term_months: e.target.value })} fullWidth />
                    </Stack>
                    <TextField select size="small" label="Виртуальная" value={String(!!form.is_virtual)} onChange={(e) => setForm({ ...form, is_virtual: e.target.value })}>
                      <MenuItem value="false">Нет</MenuItem>
                      <MenuItem value="true">Да</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Активно" value={String(!!form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <MenuItem value="true">Да</MenuItem>
                      <MenuItem value="false">Нет</MenuItem>
                    </TextField>
                  </>
                ) : tab === "tariffs" ? (
                  <>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth />
                      <TextField size="small" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" type="number" label="Плата за выпуск" value={form.issue_fee} onChange={(e) => setForm({ ...form, issue_fee: e.target.value })} fullWidth />
                      <TextField size="small" type="number" label="Плата/мес" value={form.monthly_fee} onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })} fullWidth />
                    </Stack>
                    <TextField size="small" type="number" label="Лимит снятия наличных" value={form.cash_withdraw_limit} onChange={(e) => setForm({ ...form, cash_withdraw_limit: e.target.value })} />
                    <TextField select size="small" label="Активно" value={String(!!form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <MenuItem value="true">Да</MenuItem>
                      <MenuItem value="false">Нет</MenuItem>
                    </TextField>
                  </>
                ) : (
                  <>
                    <TextField size="small" label="Код" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                    <TextField size="small" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <TextField select size="small" label="Активно" value={String(!!form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value })}>
                      <MenuItem value="true">Да</MenuItem>
                      <MenuItem value="false">Нет</MenuItem>
                    </TextField>
                  </>
                )}

                <Button variant="contained" disabled={busy || !isValid()} onClick={save}>
                  {busy ? "Сохранение..." : editId ? "Сохранить изменения" : "Сохранить"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: "1px solid #e7eaf3" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="h6">Список</Typography>
                <Button size="small" variant="outlined" onClick={load} disabled={busy}>
                  Обновить
                </Button>
              </Stack>

              {busy ? <LinearProgress sx={{ my: 1.5 }} /> : null}

              <Box sx={{ mt: 1 }}>
                {items.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Пока пусто.
                  </Typography>
                ) : (
                  <Box sx={{ border: "1px solid #eef1f7", borderRadius: 2, overflow: "hidden" }}>
                    {items.slice(0, 30).map((it, i) => {
                      const selected = editId === it.id;
                      const bg = selected ? "#eaf2ff" : i % 2 ? "#fff" : "#fafbff";
                      return (
                        <Box
                          key={it.id}
                          onClick={() => startEdit(it)}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            p: 1.25,
                            background: bg,
                            cursor: "pointer",
                            "&:hover": { background: selected ? "#e0ecff" : "#f2f6ff" },
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>{it.name || it.batch_no || it.code}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tab === "branches"
                                ? `${it.city} • ${it.address}`
                                : tab === "products"
                                ? `${it.payment_system}/${it.level} • ${it.currency}`
                                : tab === "vendors"
                                ? `${it.vendor_type} • SLA ${it.sla_days}`
                                : it.code}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                            #{it.id}
                          </Typography>
                        </Box>
                      );
                    })}
                    {items.length > 30 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", p: 1.25 }}>
                        Показано 30 из {items.length}
                      </Typography>
                    ) : null}
                  </Box>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>
                Клик по строке — откроет редактирование слева.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
