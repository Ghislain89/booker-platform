import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { TEST_MODE } from "../lib/testMode";

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message }]);
      // In test mode toasts stay until dismissed, so assertions never race a timer.
      if (!TEST_MODE) setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <section className="toasts" aria-label="Notifications">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" role="status">
            <span>{toast.message}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
            >
              Dismiss
            </button>
          </div>
        ))}
      </section>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
