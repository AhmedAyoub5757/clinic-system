import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useFlash() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(location.state?.flash ?? "");

  // Remove the message from history state so a refresh doesn't show it again
  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [flash, setFlash];
}