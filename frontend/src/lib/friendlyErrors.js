const DEFAULT_FRIENDLY_ERROR =
  "Nao foi possivel concluir esta acao agora. Verifique a ligacao e tente novamente.";

const NETWORK_FRIENDLY_ERROR =
  "Nao foi possivel ligar ao servidor neste momento. Verifique a internet ou tente novamente em instantes.";

const INTERNAL_ERROR_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network error/i,
  /load failed/i,
  /err_connection/i,
  /err_network/i,
  /econnrefused/i,
  /socket hang up/i,
  /timeout/i,
  /timed out/i,
  /unexpected token/i,
  /undefined is not/i,
  /cannot read/i,
  /cannot access/i,
  /is not a function/i,
];

export function toFriendlyErrorMessage(message, fallback = DEFAULT_FRIENDLY_ERROR) {
  const raw = String(message || "").trim();
  if (!raw) return fallback;

  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))) {
    return NETWORK_FRIENDLY_ERROR;
  }

  return raw.replace(/^error:\s*/i, "").trim() || fallback;
}

