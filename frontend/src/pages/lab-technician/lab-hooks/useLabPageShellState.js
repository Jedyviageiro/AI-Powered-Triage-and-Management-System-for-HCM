import { useLayoutEffect, useRef, useState } from "react";
import { getUser } from "../../../lib/auth";
import { loadLocalLabNotificationReadMap } from "../lab-helpers/labNotificationHelpers";

export function useLabPageShellState(initialActiveView = "dashboard") {
  const [me] = useState(getUser());
  const [activeView, setActiveView] = useState(initialActiveView);
  const [pending, setPending] = useState([]);
  const [ready, setReady] = useState([]);
  const [historyToday, setHistoryToday] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [modalVisitId, setModalVisitId] = useState(null);
  const [savingResult, setSavingResult] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsPreviewOpen, setNotificationsPreviewOpen] = useState(false);
  const [notificationReadMap, setNotificationReadMap] = useState(() =>
    loadLocalLabNotificationReadMap()
  );
  const navListRef = useRef(null);
  const navItemRefs = useRef({});
  const [navIndicator, setNavIndicator] = useState({ top: 0, height: 0, opacity: 0 });
  const notificationsPreviewRef = useRef(null);

  useLayoutEffect(() => {
    setActiveView((current) => (current === initialActiveView ? current : initialActiveView));
  }, [initialActiveView]);

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
    me,
    activeView,
    setActiveView,
    pending,
    setPending,
    ready,
    setReady,
    historyToday,
    setHistoryToday,
    loading,
    setLoading,
    err,
    setErr,
    modalVisitId,
    setModalVisitId,
    savingResult,
    setSavingResult,
    search,
    setSearch,
    sidebarOpen,
    setSidebarOpen,
    navListRef,
    navItemRefs,
    navIndicator,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    notificationReadMap,
    setNotificationReadMap,
    notificationsPreviewRef,
  };
}
