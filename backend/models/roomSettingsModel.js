const pool = require("../config/db");

let ensureRoomSettingsTablePromise = null;

const DEFAULT_ROOM_SETTINGS = {
  urgent_room_total: 4,
  standard_room_total: 4,
  quick_room_total: 4,
  urgent_room_description: "Para casos criticos com necessidade de monitorizacao continua.",
  standard_room_description: "Para casos moderados sem necessidade de cuidados intensivos.",
  quick_room_description: "Para casos leves sem necessidade de monitorizacao ou acesso IV.",
  urgent_room_tags: ["monitor", "oxigenio", "iv"],
  standard_room_tags: ["consulta", "observacao", "avaliacao"],
  quick_room_tags: ["rapido", "leve", "sem-iv"],
  urgent_room_labels: [],
  standard_room_labels: [],
  quick_room_labels: [],
};

const ensureRoomSettingsTable = async () => {
  if (!ensureRoomSettingsTablePromise) {
    ensureRoomSettingsTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS system_room_settings (
        singleton_id INTEGER PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
        urgent_room_total INTEGER NOT NULL DEFAULT 4 CHECK (urgent_room_total BETWEEN 1 AND 50),
        standard_room_total INTEGER NOT NULL DEFAULT 4 CHECK (standard_room_total BETWEEN 1 AND 50),
        quick_room_total INTEGER NOT NULL DEFAULT 4 CHECK (quick_room_total BETWEEN 1 AND 50),
        urgent_room_description TEXT NOT NULL DEFAULT 'Para casos criticos com necessidade de monitorizacao continua.',
        standard_room_description TEXT NOT NULL DEFAULT 'Para casos moderados sem necessidade de cuidados intensivos.',
        quick_room_description TEXT NOT NULL DEFAULT 'Para casos leves sem necessidade de monitorizacao ou acesso IV.',
        urgent_room_tags TEXT[] NOT NULL DEFAULT ARRAY['monitor', 'oxigenio', 'iv'],
        standard_room_tags TEXT[] NOT NULL DEFAULT ARRAY['consulta', 'observacao', 'avaliacao'],
        quick_room_tags TEXT[] NOT NULL DEFAULT ARRAY['rapido', 'leve', 'sem-iv'],
        urgent_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        standard_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        quick_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS urgent_room_description TEXT NOT NULL DEFAULT 'Para casos criticos com necessidade de monitorizacao continua.';
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS standard_room_description TEXT NOT NULL DEFAULT 'Para casos moderados sem necessidade de cuidados intensivos.';
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS quick_room_description TEXT NOT NULL DEFAULT 'Para casos leves sem necessidade de monitorizacao ou acesso IV.';
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS urgent_room_tags TEXT[] NOT NULL DEFAULT ARRAY['monitor', 'oxigenio', 'iv'];
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS standard_room_tags TEXT[] NOT NULL DEFAULT ARRAY['consulta', 'observacao', 'avaliacao'];
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS quick_room_tags TEXT[] NOT NULL DEFAULT ARRAY['rapido', 'leve', 'sem-iv'];
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS urgent_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS standard_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
      ALTER TABLE system_room_settings
        ADD COLUMN IF NOT EXISTS quick_room_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
      INSERT INTO system_room_settings (singleton_id, urgent_room_total, standard_room_total, quick_room_total)
      VALUES (1, 4, 4, 4)
      ON CONFLICT (singleton_id) DO NOTHING;
    `);
  }
  return ensureRoomSettingsTablePromise;
};

const getSettings = async () => {
  await ensureRoomSettingsTable();
  const result = await pool.query(
    `SELECT urgent_room_total, standard_room_total, quick_room_total,
            urgent_room_description, standard_room_description, quick_room_description,
            urgent_room_tags, standard_room_tags, quick_room_tags,
            urgent_room_labels, standard_room_labels, quick_room_labels,
            updated_at
     FROM system_room_settings
     WHERE singleton_id = 1
     LIMIT 1`
  );
  return result.rows[0] || { ...DEFAULT_ROOM_SETTINGS };
};

const updateSettings = async (payload = {}) => {
  await ensureRoomSettingsTable();
  const result = await pool.query(
    `UPDATE system_room_settings
     SET urgent_room_total = $1,
         standard_room_total = $2,
         quick_room_total = $3,
         urgent_room_description = $4,
         standard_room_description = $5,
         quick_room_description = $6,
         urgent_room_tags = $7,
         standard_room_tags = $8,
         quick_room_tags = $9,
         urgent_room_labels = $10,
         standard_room_labels = $11,
         quick_room_labels = $12,
         updated_at = NOW()
     WHERE singleton_id = 1
     RETURNING urgent_room_total, standard_room_total, quick_room_total,
               urgent_room_description, standard_room_description, quick_room_description,
               urgent_room_tags, standard_room_tags, quick_room_tags,
               urgent_room_labels, standard_room_labels, quick_room_labels,
               updated_at`,
    [
      payload.urgent_room_total,
      payload.standard_room_total,
      payload.quick_room_total,
      payload.urgent_room_description,
      payload.standard_room_description,
      payload.quick_room_description,
      payload.urgent_room_tags,
      payload.standard_room_tags,
      payload.quick_room_tags,
      payload.urgent_room_labels,
      payload.standard_room_labels,
      payload.quick_room_labels,
    ]
  );
  return result.rows[0] || null;
};

module.exports = {
  DEFAULT_ROOM_SETTINGS,
  getSettings,
  updateSettings,
};
