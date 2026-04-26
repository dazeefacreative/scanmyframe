import React, { useEffect, useState } from "react";

export default function MessageDisplay({ message, setMessage }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        setMessage({ err: "", normal: "", success: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);


  const baseStyle = {
  position: "fixed",
  top: "20%",
  right: "20px",
  padding: "12px 18px",
  borderRadius: "6px",
  maxWidth: "300px",
  zIndex: 9999,
  transform: show ? "translateX(0%)" : "translateX(100%)",
  opacity: show ? 1 : 0,
  transition: "transform 0.5s ease, opacity 0.5s ease"
};

let style = {
  ...baseStyle,
  // default normal style
  ...(message.normal && {
    background: "#fdf6f6ff",
    borderLeft: "4px solid #6c5757ff",
    color: "#000"
  }),
  // success overrides normal
  ...(message.success && {
    background: "#ddffdd",
    borderLeft: "4px solid #339a36ff",
    color: "var(--espresso-brown)"
  }),
  // error overrides everything
  ...(message.err && {
    background: "#ffdddd",
    borderLeft: "4px solid #de1f22ff",
    color: "var(--cherry-red)"
  })
};


  if (!message) return null;

  return (
    <div style={style}>
      {message.err && <p>{message.err}</p>}
      {message.success && <p>{message.success}</p>}
      {message.normal && <p>{message.normal}</p>}
    </div>
  );
}
