import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            variant === "danger"
              ? "rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 p-2 text-rose-600 ring-1 ring-inset ring-rose-100"
              : "rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-2 text-amber-600 ring-1 ring-inset ring-amber-100"
          }
        >
          <AlertTriangle className="size-5" />
        </span>
        <div className="text-sm text-slate-600">{message}</div>
      </div>
    </Modal>
  );
}