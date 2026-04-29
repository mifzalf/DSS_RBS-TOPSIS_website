import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog({ open, title, description, confirmLabel = 'Konfirmasi', onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{description}</p>
    </Modal>
  )
}
