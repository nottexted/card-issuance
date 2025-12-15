import React, { PropsWithChildren } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Tooltip,
  Divider,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SettingsIcon from "@mui/icons-material/Settings";
import InsightsIcon from "@mui/icons-material/Insights";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const drawerWidth = 280;
const collapsedWidth = 76;
const LS_KEY = "cis.nav.open";

const nav = [
  { to: "/dashboard", label: "Дашборд", icon: <DashboardIcon /> },
  { to: "/applications", label: "Заявки", icon: <AssignmentIcon /> },
  { to: "/clients", label: "Клиенты", icon: <PeopleIcon /> },
  { to: "/batches", label: "Партии эмиссии", icon: <LocalShippingIcon /> },
  { to: "/cards", label: "Карты", icon: <CreditCardIcon /> },
  { to: "/directories", label: "Справочники", icon: <SettingsIcon /> },
  { to: "/reports", label: "Отчеты", icon: <InsightsIcon /> },
];

function readNavOpen(): boolean {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v === null) return true;
    return v === "1";
  } catch {
    return true;
  }
}

export default function Shell({ children }: PropsWithChildren) {
  const location = useLocation();
  const [open, setOpen] = React.useState<boolean>(() => readNavOpen());

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  const drawerW = open ? drawerWidth : collapsedWidth;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" elevation={0} sx={{ borderBottom: "1px solid #e7eaf3", background: "#fff", color: "#111" }}>
        <Toolbar>
          <Tooltip title={open ? "Свернуть меню" : "Развернуть меню"}>
            <IconButton onClick={() => setOpen((v) => !v)} edge="start" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }}>
            Card Issuance Service
          </Typography>

          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            {new Date().toLocaleString()}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerW,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerW,
            boxSizing: "border-box",
            borderRight: "1px solid #e7eaf3",
            background: "#ffffff",
            overflowX: "hidden",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-end' : 'center' }}>
          <Tooltip title={open ? 'Свернуть меню' : 'Развернуть меню'}>
            <IconButton size="small" onClick={() => setOpen((v) => !v)}>
              {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ px: 1, py: 1 }}>
          {open ? (
            <Typography variant="caption" sx={{ px: 2, color: "#6b7280" }}>
              Навигация
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ px: 2, color: "#6b7280" }}>
              •••
            </Typography>
          )}
        </Box>

        <List sx={{ pt: 0 }}>
          {nav.map((item) => {
            const active = location.pathname === item.to;
            const btn = (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                selected={active}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  justifyContent: open ? "initial" : "center",
                  px: open ? 2 : 1.5,
                  "&.Mui-selected": { background: "#eef2ff" },
                }}
              >
                <ListItemIcon sx={{ minWidth: open ? 44 : 0, color: active ? "#1d4ed8" : "#111", justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                {open ? <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} /> : null}
              </ListItemButton>
            );

            return open ? (
              btn
            ) : (
              <Tooltip key={item.to} title={item.label} placement="right">
                <Box>{btn}</Box>
              </Tooltip>
            );
          })}
        </List>

        <Box sx={{ flex: 1 }} />
        <Divider />
        <Box sx={{ p: 2 }}>
          {open ? (
            <>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Demo-проект: FastAPI + Postgres + React (MUI)
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.5 }}>
                Меню запоминает состояние (localStorage).
              </Typography>
            </>
          ) : (
            <Tooltip title="Меню запоминает состояние (localStorage)" placement="right">
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                i
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, background: "#f6f7fb", minHeight: "100vh" }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
