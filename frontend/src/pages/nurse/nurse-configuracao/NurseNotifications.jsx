import NotificationListView from "../../../components/shared/NotificationListView";
import NursePage from "../NursePage";

export function NurseNotificationsView({
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

export default function NurseNotifications() {
  return <NursePage forcedView="notifications" />;
}
