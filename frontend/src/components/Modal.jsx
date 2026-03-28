import CenteredModal from "./CenteredModal";

// Alias for backwards-compatibility — wraps CenteredModal
const Modal = ({ isOpen, onClose, title, children, size }) => (
  <CenteredModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    maxWidth={size === "lg" ? "600px" : size === "sm" ? "380px" : "480px"}
  >
    {children}
  </CenteredModal>
);

export default Modal;
