export async function uploadImageToCloudinary({ file, cloudName, uploadPreset }) {
  if (!cloudName || !uploadPreset) {
    throw new Error("Configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.");
  }

  if (!file) {
    throw new Error("Selecione uma imagem.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "pedriatic-system/users");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || "Falha ao carregar imagem no Cloudinary.");
  }

  return {
    url: data?.secure_url || data?.url || "",
    publicId: data?.public_id || "",
  };
}
