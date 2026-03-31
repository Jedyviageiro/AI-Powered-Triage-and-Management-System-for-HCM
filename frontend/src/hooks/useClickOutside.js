import { useEffect } from "react";

export function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const handlePointerDown = (event) => {
      const element = ref?.current;
      if (!element || element.contains(event.target)) return;
      handler?.(event);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [enabled, handler, ref]);
}
