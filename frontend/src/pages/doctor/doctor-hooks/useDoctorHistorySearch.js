import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";

export function useDoctorHistorySearch({ activeView, historySearchRef, setErr }) {
  const [historyQuery, setHistoryQuery] = useState("");
  const [historySearchLoading, setHistorySearchLoading] = useState(false);
  const [historySearchResults, setHistorySearchResults] = useState([]);
  const [historySuggestOpen, setHistorySuggestOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState({
    open: false,
    patient: null,
    visits: [],
    loading: false,
  });

  const searchHistoryPatients = useCallback(async () => {
    const q = String(historyQuery || "").trim();
    if (q.length < 1) {
      setErr("Escreva pelo menos 1 letra para pesquisar paciente.");
      return;
    }
    setHistorySearchLoading(true);
    setErr("");
    try {
      const rows = await api.searchPatients(q);
      setHistorySearchResults(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e.message);
      setHistorySearchResults([]);
    } finally {
      setHistorySearchLoading(false);
    }
  }, [historyQuery, setErr]);

  const openHistoryPatient = useCallback(
    async (patient) => {
      if (!patient?.id) return;
      setHistorySuggestOpen(false);
      setHistoryQuery("");
      setHistorySearchResults([]);
      setHistorySearchLoading(false);
      setHistoryModal({ open: true, patient, visits: [], loading: true });
      setErr("");
      try {
        const visits = await api.getPatientHistory(patient.id);
        setHistoryModal({
          open: true,
          patient,
          visits: Array.isArray(visits) ? visits : [],
          loading: false,
        });
      } catch (e) {
        setErr(e.message);
        setHistoryModal({ open: true, patient, visits: [], loading: false });
      }
    },
    [setErr]
  );

  const closeHistoryModal = useCallback(() => {
    setHistorySuggestOpen(false);
    setHistoryQuery("");
    setHistorySearchResults([]);
    setHistorySearchLoading(false);
    setHistoryModal({ open: false, patient: null, visits: [], loading: false });
  }, []);

  useEffect(() => {
    if (activeView !== "clinicalHistory") return;
    const q = String(historyQuery || "").trim();
    if (!q) {
      setHistorySearchResults([]);
      setHistorySearchLoading(false);
      return;
    }
    const timeoutId = setTimeout(() => {
      searchHistoryPatients();
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [activeView, historyQuery, searchHistoryPatients]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      const root = historySearchRef.current;
      const target = event?.target;
      if (!root || !(target instanceof Node)) return;
      if (!root.contains(target)) setHistorySuggestOpen(false);
    };
    const onDocKeyDown = (event) => {
      if (event?.key === "Escape") setHistorySuggestOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [historySearchRef]);

  return {
    historyQuery,
    setHistoryQuery,
    historySearchLoading,
    historySearchResults,
    historySuggestOpen,
    setHistorySuggestOpen,
    historyModal,
    searchHistoryPatients,
    openHistoryPatient,
    closeHistoryModal,
  };
}
