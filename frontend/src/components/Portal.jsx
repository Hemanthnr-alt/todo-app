import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body via a React Portal.
 * This ensures position:fixed modals are always relative to the viewport,
 * not to any transformed ancestor (e.g. framer-motion animated parents).
 */
export default function Portal({ children }) {
  const el = useRef(document.createElement("div"));

  useEffect(() => {
    const portal = el.current;
    document.body.appendChild(portal);
    return () => {
      document.body.removeChild(portal);
    };
  }, []);

  return createPortal(children, el.current);
}
