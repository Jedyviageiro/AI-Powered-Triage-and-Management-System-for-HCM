import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";

export function useDoctorHistorySearch({ activeView, historySearchRef, setErr, showPopup }) {
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

  const searchHistoryPatients = useCallback(async ({ notifyEmpty = false } = {}) => {
    const q = String(historyQuery || "").trim();
    if (q.length < 1) {
      const message = "Escreva pelo menos 1 letra para pesquisar paciente.";
      if (notifyEmpty) showPopup?.("warning", "Pesquisa vazia", message);
      else setErr(message);
      return { ok: false, empty: true, rows: [], query: q };
    }
    setHistorySearchLoading(true);
    setErr("");
    try {
      const rows = await api.searchPatients(q);
      const nextRows = Array.isArray(rows) ? rows : [];
      setHistorySearchResults(nextRows);
      if (notifyEmpty && nextRows.length === 0) {
        setHistorySuggestOpen(false);
        showPopup?.(
          "warning",
          "Paciente nao encontrado",
          `Nao existe nenhum paciente registado com o nome "${q}". Confirme a escrita ou solicite o registo do paciente.`
        );
      }
      return { ok: true, empty: nextRows.length === 0, rows: nextRows, query: q };
    } catch (e) {
      setErr(e.message);
      setHistorySearchResults([]);
      return { ok: false, empty: false, rows: [], query: q, error: e };
    } finally {
      setHistorySearchLoading(false);
    }
  }, [historyQuery, setErr, showPopup]);

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
