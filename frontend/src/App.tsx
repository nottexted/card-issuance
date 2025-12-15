import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./layout/Shell";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import Clients from "./pages/Clients";
import Batches from "./pages/Batches";
import Cards from "./pages/Cards";
import Directories from "./pages/Directories";
import Reports from "./pages/Reports";
import { MetaProvider } from "./state/meta";

export default function App() {
  return (
    <MetaProvider>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/directories" element={<Directories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Shell>
    </MetaProvider>
  );
}
