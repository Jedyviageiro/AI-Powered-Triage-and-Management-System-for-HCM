import { useLayoutEffect, useRef, useState } from "react";

export function useAdminPageShellState(initialActiveView = "dashboard") {
  const navListRef = useRef(null);
  const navItemRefs = useRef({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState(initialActiveView);
  const [navIndicator, setNavIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  useLayoutEffect(() => {
    const updateNavIndicator = () => {
      const navEl = navListRef.current;
      const activeEl = navItemRefs.current?.[activeView];
      if (!navEl || !activeEl) {
        setNavIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      const itemRect = activeEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setNavIndicator({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        opacity: 1,
      });
    };

    updateNavIndicator();
    window.addEventListener("resize", updateNavIndicator);
    return () => window.removeEventListener("resize", updateNavIndicator);
  }, [activeView, sidebarOpen]);

  return {
    navListRef,
    navItemRefs,
    sidebarOpen,
    setSidebarOpen,
    activeView,
    setActiveView,
    navIndicator,
  };
}
