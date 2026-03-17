import PreferencesView from "../../../components/shared/PreferencesView";
import NursePage from "../NursePage";

export function NursePreferencesView({
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
      key={`prefs-${JSON.stringify(preferences || {})}`}
      me={me}
      shiftStatus={shiftStatus}
      onLogout={onLogout}
      preferences={preferences}
      loading={loading}
      saving={saving}
      onSave={onSave}
      onPreview={onPreview}
    />
  );
}

export default function NursePreferences() {
  return <NursePage forcedView="preferences" />;
}
