const FirecrawlModule = require("@mendable/firecrawl-js");

const Firecrawl = FirecrawlModule.default || FirecrawlModule;

const WHO_DOMAIN_PATTERN = /(^|\.)who\.int$/i;
const CACHE_TTL_MS = 1000 * 60 * 30;
const MAX_REFERENCES = 2;
const queryCache = new Map();

const clip = (value, max = 600) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 3).trim()}...`;
};

const isWhoUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return WHO_DOMAIN_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
};

const normalizeToken = (value, max = 80) =>
  clip(value, max)
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildQueries = (payload = {}) => {
  const diagnosis = normalizeToken(payload.doctor_likely_diagnosis, 80);
  const complaint = normalizeToken(payload.chief_complaint, 80);
  const prescription = normalizeToken(payload.doctor_prescription_text, 60)
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 2)
    .join(" ");

  const queries = [
    ["site:who.int", "child", diagnosis].filter(Boolean).join(" "),
    ["site:who.int", "pediatric", complaint].filter(Boolean).join(" "),
    ["site:who.int", "child", diagnosis, prescription].filter(Boolean).join(" "),
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(queries)].slice(0, 2);
};

const getClient = () => {
  const apiKey = String(process.env.FIRECRAWL_API_KEY || "").trim();
  if (!apiKey) return null;
  return new Firecrawl({ apiKey });
};

const normalizeResult = (entry) => {
  if (!entry || typeof entry !== "object") return null;

  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
  const url = String(entry.url || metadata.url || metadata.sourceURL || "").trim();
  if (!isWhoUrl(url)) return null;

  return {
    title: clip(entry.title || metadata.title || metadata.ogTitle || "WHO reference", 140),
    url,
    summary: clip(entry.summary || entry.description || metadata.description || "", 500),
  };
};

const formatGroundingBlock = (references = []) => {
  if (!Array.isArray(references) || references.length === 0) {
    return "SEM_REFERENCIAS_WHO_RELEVANTES";
  }

  return references
    .map(
      (item, index) =>
        `FONTE ${index + 1}:\n- titulo: ${item.title}\n- url: ${item.url}\n- resumo: ${
          item.summary || "n/a"
        }`
    )
    .join("\n\n");
};

async function getWhoMedicationGuidance(payload = {}) {
  const client = getClient();
  if (!client) {
    return {
      enabled: false,
      used: false,
      references: [],
      groundingBlock: "FIRECRAWL_NAO_CONFIGURADO",
    };
  }

  const queries = buildQueries(payload);
  if (queries.length === 0) {
    return {
      enabled: true,
      used: false,
      references: [],
      groundingBlock: "CONSULTA_WHO_NAO_GERADA",
    };
  }

  const cacheKey = JSON.stringify(queries);
  const cached = queryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const references = [];
    let lastErrorMessage = "";

    for (const query of queries) {
      let response = null;

      try {
        response = await client.search(query, {
          limit: MAX_REFERENCES,
          sources: ["web"],
          timeout: 12000,
          scrapeOptions: {
            formats: ["summary"],
            onlyMainContent: true,
          },
        });
      } catch (error) {
        lastErrorMessage = clip(error?.message || "", 180);
        response = null;
      }

      if (!response) {
        try {
          response = await client.search(query, {
            limit: MAX_REFERENCES,
            sources: ["web"],
            timeout: 8000,
          });
        } catch (error) {
          lastErrorMessage = clip(error?.message || "", 180);
          response = null;
        }
      }

      const nextReferences = (Array.isArray(response?.web) ? response.web : [])
        .map(normalizeResult)
        .filter(Boolean);

      for (const item of nextReferences) {
        if (!references.some((existing) => existing.url === item.url)) {
          references.push(item);
        }
        if (references.length >= MAX_REFERENCES) break;
      }

      if (references.length >= MAX_REFERENCES) break;
    }

    const value = {
      enabled: true,
      used: references.length > 0,
      references,
      groundingBlock:
        references.length > 0
          ? formatGroundingBlock(references)
          : lastErrorMessage
            ? `FALHA_AO_CONSULTAR_WHO: ${lastErrorMessage}`
            : formatGroundingBlock(references),
    };

    queryCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value,
    });

    return value;
  } catch (error) {
    return {
      enabled: true,
      used: false,
      references: [],
      groundingBlock: `FALHA_AO_CONSULTAR_WHO: ${clip(error?.message || "erro desconhecido", 180)}`,
    };
  }
}

module.exports = {
  getWhoMedicationGuidance,
};
