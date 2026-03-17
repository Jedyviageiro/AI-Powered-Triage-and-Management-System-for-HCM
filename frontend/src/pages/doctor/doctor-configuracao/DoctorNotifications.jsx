import DoctorPage from "../DoctorPage";
import NotificationListView from "../../../components/shared/NotificationListView";

export function DoctorNotificationsView({
  notifications,
  unreadCount,
  loading,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}) {
  return (
    <NotificationListView
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      onRefresh={onRefresh}
      onMarkRead={onMarkRead}
      onMarkAllRead={onMarkAllRead}
    />
  );
}

export default function DoctorNotifications() {
  return <DoctorPage forcedView="notifications" />;
}
