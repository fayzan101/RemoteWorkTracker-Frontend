import React from "react";

interface PopupProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  okText?: string;
}

const Popup: React.FC<PopupProps> = ({ open, title, message, onClose, okText = "OK" }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        minWidth: 320,
        maxWidth: 400,
        boxShadow: "0 8px 32px 0 rgba(31,41,55,0.18)",
        padding: 32,
        textAlign: "center",
      }}>
        {title && <h2 style={{ marginBottom: 12 }}>{title}</h2>}
        <div style={{ marginBottom: 24 }}>{message}</div>
        <button
          style={{
            padding: "10px 32px",
            borderRadius: 8,
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
          onClick={onClose}
        >
          {okText}
        </button>
      </div>
    </div>
  );
};

export default Popup;
