import { useEffect, useMemo, useState } from "react";
import { clearAuth, getUser } from "../../lib/auth";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { ADMIN_NAV_SECTIONS } from "./admin-config/adminNavigationConfig.jsx";
import { uploadImageToCloudinary } from "./admin-helpers/adminCloudinary.js";
import { AdminDashboardView } from "./admin-dashboard/AdminDashboard.jsx";
import { AdminCreateUserView } from "./admin-create/AdminCreateUser.jsx";
import { useAdminPageShellState } from "./admin-hooks/useAdminPageShellState.js";
import { AdminLayout } from "./admin-layout/AdminLayout.jsx";
import { AdminRoomsView } from "./admin-rooms/AdminRooms.jsx";
import { AdminShiftsView } from "./admin-shifts/AdminShifts.jsx";
import { AdminUsersView } from "./admin-users/AdminUsers.jsx";

export default function Admin() {
  const navigate = useNavigate();
  const me = getUser();
  const myId = me?.id;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";
  const canUpload = Boolean(cloudName && uploadPreset);

  const {
    navListRef,
    navItemRefs,
    sidebarOpen,
    setSidebarOpen,
    activeView,
    setActiveView,
    navIndicator,
  } = useAdminPageShellState("dashboard");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [uploadingPhotoUserId, setUploadingPhotoUserId] = useState(null);
  const [roomSettings, setRoomSettings] = useState({
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
  });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [savingRooms, setSavingRooms] = useState(false);

  const loadUsers = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadRoomSettings = async () => {
    setLoadingRooms(true);
    try {
      const data = await api.getRoomSettings();
      setRoomSettings({
        urgent_room_total: Number(data?.urgent_room_total || 4),
        standard_room_total: Number(data?.standard_room_total || 4),
        quick_room_total: Number(data?.quick_room_total || 4),
        urgent_room_description: String(data?.urgent_room_description || "Para casos criticos com necessidade de monitorizacao continua."),
        standard_room_description: String(data?.standard_room_description || "Para casos moderados sem necessidade de cuidados intensivos."),
        quick_room_description: String(data?.quick_room_description || "Para casos leves sem necessidade de monitorizacao ou acesso IV."),
        urgent_room_tags: Array.isArray(data?.urgent_room_tags) ? data.urgent_room_tags : ["monitor", "oxigenio", "iv"],
        standard_room_tags: Array.isArray(data?.standard_room_tags) ? data.standard_room_tags : ["consulta", "observacao", "avaliacao"],
        quick_room_tags: Array.isArray(data?.quick_room_tags) ? data.quick_room_tags : ["rapido", "leve", "sem-iv"],
        urgent_room_labels: Array.isArray(data?.urgent_room_labels) ? data.urgent_room_labels : [],
        standard_room_labels: Array.isArray(data?.standard_room_labels) ? data.standard_room_labels : [],
        quick_room_labels: Array.isArray(data?.quick_room_labels) ? data.quick_room_labels : [],
      });
    } catch (error) {
      if (Number(error?.status) === 404) {
        setRoomSettings({
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
        });
        setErr("A configuracao de salas ainda nao esta disponivel no backend. Reinicie o servidor para activar /room-settings.");
      } else {
        setErr(error.message);
      }
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadRoomSettings();
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadUsers(), loadRoomSettings()]);
  };

  const visibleUsers = useMemo(() => users.filter((user) => user.id !== myId), [users, myId]);

  const handleUploadImage = async (file) =>
    uploadImageToCloudinary({
      file,
      cloudName,
      uploadPreset,
    });

  const uploadUserPhoto = async (user, file) => {
    if (!file) return;
    setErr("");
    setUploadingPhotoUserId(user.id);
    try {
      const uploaded = await handleUploadImage(file);
      await api.updateUser(user.id, {
        profile_photo_url: uploaded.url,
        profile_photo_public_id: uploaded.publicId,
      });
      await loadUsers();
    } catch (error) {
      setErr(error.message);
    } finally {
      setUploadingPhotoUserId(null);
    }
  };

  const content =
    activeView === "dashboard" ? (
      <AdminDashboardView users={visibleUsers} onNavigate={setActiveView} />
    ) : activeView === "users" ? (
      <AdminUsersView
        users={visibleUsers}
        onRefresh={loadUsers}
        uploadingPhotoUserId={uploadingPhotoUserId}
        onUploadPhoto={uploadUserPhoto}
        canUpload={canUpload}
      />
    ) : activeView === "rooms" ? (
      <AdminRoomsView
        roomSettings={roomSettings}
        loading={loadingRooms}
        saving={savingRooms}
        onSave={async (payload) => {
          setSavingRooms(true);
          try {
            const saved = await api.updateRoomSettings(payload);
            setRoomSettings({
              urgent_room_total: Number(saved?.urgent_room_total || payload.urgent_room_total || 4),
              standard_room_total: Number(saved?.standard_room_total || payload.standard_room_total || 4),
              quick_room_total: Number(saved?.quick_room_total || payload.quick_room_total || 4),
              urgent_room_description: String(saved?.urgent_room_description || payload.urgent_room_description || ""),
              standard_room_description: String(saved?.standard_room_description || payload.standard_room_description || ""),
              quick_room_description: String(saved?.quick_room_description || payload.quick_room_description || ""),
              urgent_room_tags: Array.isArray(saved?.urgent_room_tags) ? saved.urgent_room_tags : payload.urgent_room_tags || [],
              standard_room_tags: Array.isArray(saved?.standard_room_tags) ? saved.standard_room_tags : payload.standard_room_tags || [],
              quick_room_tags: Array.isArray(saved?.quick_room_tags) ? saved.quick_room_tags : payload.quick_room_tags || [],
              urgent_room_labels: Array.isArray(saved?.urgent_room_labels) ? saved.urgent_room_labels : payload.urgent_room_labels || [],
              standard_room_labels: Array.isArray(saved?.standard_room_labels) ? saved.standard_room_labels : payload.standard_room_labels || [],
              quick_room_labels: Array.isArray(saved?.quick_room_labels) ? saved.quick_room_labels : payload.quick_room_labels || [],
            });
            return saved;
          } finally {
            setSavingRooms(false);
          }
        }}
      />
    ) : activeView === "shifts" ? (
      <AdminShiftsView users={visibleUsers} onRefresh={loadUsers} />
    ) : (
      <AdminCreateUserView
        canUpload={canUpload}
        uploadImage={handleUploadImage}
        onCreated={async () => {
          await loadUsers();
          setActiveView("users");
        }}
      />
    );

  return (
    <AdminLayout
      me={me}
      loading={loading}
      error={err}
      activeView={activeView}
      setActiveView={setActiveView}
      navSections={ADMIN_NAV_SECTIONS}
      navListRef={navListRef}
      navItemRefs={navItemRefs}
      navIndicator={navIndicator}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onRefresh={refreshAll}
      onCreateClick={() => setActiveView("create")}
      onLogout={() => {
        clearAuth();
        navigate("/login", { replace: true });
      }}
    >
      {content}
    </AdminLayout>
  );
}
