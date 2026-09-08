import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info' }

  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const hide = useCallback(() => setToast(null), []);

  return { toast, show, hide };
}
