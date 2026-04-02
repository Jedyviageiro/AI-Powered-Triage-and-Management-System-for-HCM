import { useEffect, useMemo, useRef, useState } from "react";
import { cropImageToSquareFile, getSquareCropPreviewLayout } from "./adminImageTools.js";
import { AdminButton } from "./adminUi.jsx";

export function AdminPhotoPicker({
  canUpload,
  disabled = false,
  uploading = false,
  buttonLabel = "Foto",
  compact = false,
  previewUrl = "",
  onUpload,
  onError,
}) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return undefined;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  const activePreview = useMemo(() => localPreviewUrl || previewUrl || "", [localPreviewUrl, previewUrl]);
  const previewLayout = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return null;
    return getSquareCropPreviewLayout({
      sourceWidth: imageSize.width,
      sourceHeight: imageSize.height,
      viewportSize: 1000,
      zoom,
      offsetX,
      offsetY,
    });
  }, [imageSize.height, imageSize.width, offsetX, offsetY, zoom]);

  const openPicker = () => {
    if (disabled || uploading || !canUpload) return;
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) return;
    setSelectedFile(nextFile);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    event.target.value = "";
  };

  const closeCropper = () => {
    setSelectedFile(null);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setImageSize({ width: 0, height: 0 });
  };

  const confirmCrop = async () => {
    if (!selectedFile || !onUpload) return;
    setProcessing(true);
    try {
      const croppedFile = await cropImageToSquareFile(selectedFile, { zoom, offsetX, offsetY });
      await onUpload(croppedFile);
      closeCropper();
    } catch (error) {
      onError?.(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        disabled={disabled || uploading || !canUpload}
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || uploading || !canUpload}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minWidth: compact ? 84 : 120,
          padding: compact ? "8px 12px" : "10px 14px",
          borderRadius: 999,
          border: "1px dashed #86a69b",
          background: canUpload ? "#f8fbf8" : "#f8fafc",
          color: canUpload ? "#165034" : "#94a3b8",
          cursor: disabled || uploading || !canUpload ? "not-allowed" : "pointer",
          opacity: disabled || uploading ? 0.7 : 1,
          fontSize: compact ? 12 : 13,
          fontWeight: 700,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploading ? "A carregar..." : buttonLabel}
      </button>

      {selectedFile ? (
        <div className="popup-overlay" onClick={closeCropper}>
          <div
            className="popup-card popup-scroll"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(860px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 28,
              padding: 0,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(226,232,240,0.9)",
              boxShadow: "0 30px 80px rgba(15, 23, 42, 0.24)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-start",
                padding: "24px 24px 18px",
                borderBottom: "1px solid rgba(226,232,240,0.9)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.72) 100%)",
              }}
            >
              <div style={{ maxWidth: 520 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Ajustar foto de perfil</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  Ajuste o enquadramento com mais precisao. A imagem salva vai respeitar exatamente este recorte.
                </div>
              </div>
              <button
                type="button"
                onClick={closeCropper}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  border: "1px solid #e2e8f0",
                  background: "rgba(255,255,255,0.85)",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                x
              </button>
            </div>

            <div className="admin-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.12fr) minmax(280px, 340px)", gap: 18, alignItems: "start", padding: 24 }}>
              <div
                style={{
                  background: "linear-gradient(160deg, #eef6f1 0%, #f8fafc 100%)",
                  border: "1px solid #dbe5df",
                  borderRadius: 26,
                  padding: 18,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b" }}>
                    Enquadramento
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Avatar quadrado</div>
                </div>
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 20,
                    overflow: "hidden",
                    position: "relative",
                    background: "#dfe8e3",
                  }}
                >
                  {activePreview ? (
                    <img
                      src={activePreview}
                      alt="Preview do recorte"
                      onLoad={(event) =>
                        setImageSize({
                          width: event.currentTarget.naturalWidth || 0,
                          height: event.currentTarget.naturalHeight || 0,
                        })
                      }
                      style={{
                        position: "absolute",
                        width: previewLayout ? `${(previewLayout.renderedWidth / previewLayout.viewportSize) * 100}%` : "100%",
                        height: previewLayout ? `${(previewLayout.renderedHeight / previewLayout.viewportSize) * 100}%` : "100%",
                        left: previewLayout ? `${(previewLayout.left / previewLayout.viewportSize) * 100}%` : 0,
                        top: previewLayout ? `${(previewLayout.top / previewLayout.viewportSize) * 100}%` : 0,
                        objectFit: "fill",
                        maxWidth: "none",
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: "2px solid rgba(255,255,255,0.8)",
                      borderRadius: 20,
                      boxShadow: "inset 0 0 0 9999px rgba(15, 23, 42, 0.12)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 100%)",
                  border: "1px solid #e2e8f0",
                  borderRadius: 26,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b" }}>
                  Ajustes
                </div>
                <Slider label="Zoom" value={zoom} min={1} max={2.8} step={0.05} onChange={setZoom} formatter={(value) => `${value.toFixed(2)}x`} />
                <Slider label="Mover esquerda-direita" value={offsetX} min={-100} max={100} step={1} onChange={setOffsetX} formatter={(value) => `${value}%`} />
                <Slider label="Mover cima-baixo" value={offsetY} min={-100} max={100} step={1} onChange={setOffsetY} formatter={(value) => `${value}%`} />

                <div
                  style={{
                    borderRadius: 20,
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                    border: "1px solid #e2e8f0",
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "#dbe5df", flexShrink: 0 }}>
                    {activePreview ? (
                      <div style={{ position: "relative", width: "100%", height: "100%" }}>
                        <img
                          src={activePreview}
                          alt="Miniatura"
                          style={{
                            position: "absolute",
                            width: previewLayout ? `${(previewLayout.renderedWidth / previewLayout.viewportSize) * 100}%` : "100%",
                            height: previewLayout ? `${(previewLayout.renderedHeight / previewLayout.viewportSize) * 100}%` : "100%",
                            left: previewLayout ? `${(previewLayout.left / previewLayout.viewportSize) * 100}%` : 0,
                            top: previewLayout ? `${(previewLayout.top / previewLayout.viewportSize) * 100}%` : 0,
                            objectFit: "fill",
                            maxWidth: "none",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                    Preview final do avatar. Use os controlos ate a foto ficar exatamente como voce quer salvar.
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4, paddingTop: 4 }}>
                  <AdminButton onClick={closeCropper} disabled={processing}>Cancelar</AdminButton>
                  <AdminButton primary onClick={confirmCrop} disabled={processing}>
                    {processing ? "A preparar..." : "Aplicar foto"}
                  </AdminButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Slider({ label, value, min, max, step, onChange, formatter }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{formatter(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: "100%", accentColor: "#165034" }}
      />
    </label>
  );
}
