import "./primitives.css"

export interface ToastItem {
  id: string
  message: string
  variant?: "success" | "error" | "warning" | "info"
}

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.variant || "info"}`}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
