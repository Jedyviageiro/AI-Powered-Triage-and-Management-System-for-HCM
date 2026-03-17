import DoctorPage from "../DoctorPage";
import PreferencesView from "../../../components/shared/PreferencesView";

export function DoctorPreferencesView({
  me,
  shiftStatus,
  onLogout,
  preferences,
  loading,
  saving,
  onSave,
  onPreview,
}) {
  return (
    <PreferencesView
      me={me}
      shiftStatus={shiftStatus}
      onLogout={onLogout}
      preferences={preferences}
      loading={loading}
      saving={saving}
      onSave={onSave}
      onPreview={onPreview}
      subtitle="Configuracao pessoal do medico"
      roleLabel={me?.specialization ? `Medico · ${me.specialization}` : "Medico"}
    />
  );
}

export default function DoctorPreferences() {
  return <DoctorPage forcedView="preferences" />;
}
