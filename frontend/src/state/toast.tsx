import React from "react";
import { Alert, Snackbar } from "@mui/material";

type Toast = { open: boolean; message: string; severity: "success" | "info" | "warning" | "error" };

const ToastCtx = React.createContext<{
  toast: Toast;
  show: (message: string, severity?: Toast["severity"]) => void;
}>({ toast: { open: false, message: "", severity: "info" }, show: () => {} });

export function ToastProvider({ children }: React.PropsWithChildren) {
  const [toast, setToast] = React.useState<Toast>({ open: false, message: "", severity: "info" });

  const show = (message: string, severity: Toast["severity"] = "info") => {
    setToast({ open: true, message: message || "Сообщение", severity });
  };

  return (
    <ToastCtx.Provider value={{ toast, show }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ whiteSpace: "pre-line" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastCtx);
}
