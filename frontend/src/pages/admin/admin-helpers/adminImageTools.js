export async function cropImageToSquareFile(file, { zoom = 1, offsetX = 0, offsetY = 0, size = 512 } = {}) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Nao foi possivel preparar a imagem.");
    }

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const layout = getSquareCropLayout({
      sourceWidth,
      sourceHeight,
      viewportSize: size,
      zoom,
      offsetX,
      offsetY,
    });

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      layout.sourceX,
      layout.sourceY,
      layout.sourceCropSize,
      layout.sourceCropSize,
      0,
      0,
      size,
      size
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("Falha ao preparar a imagem recortada."));
        },
        "image/jpeg",
        0.92
      );
    });

    const baseName = String(file.name || "profile-photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getSquareCropPreviewLayout({
  sourceWidth,
  sourceHeight,
  viewportSize = 1000,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}) {
  const safeZoom = Math.max(Number(zoom) || 1, 1);
  const baseScale = Math.max(viewportSize / sourceWidth, viewportSize / sourceHeight);
  const scale = baseScale * safeZoom;
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const maxPanX = Math.max((renderedWidth - viewportSize) / 2, 0);
  const maxPanY = Math.max((renderedHeight - viewportSize) / 2, 0);
  const translateX = (clamp(Number(offsetX) || 0, -100, 100) / 100) * maxPanX;
  const translateY = (clamp(Number(offsetY) || 0, -100, 100) / 100) * maxPanY;
  const left = (viewportSize - renderedWidth) / 2 + translateX;
  const top = (viewportSize - renderedHeight) / 2 + translateY;

  return {
    viewportSize,
    renderedWidth,
    renderedHeight,
    left,
    top,
  };
}

function getSquareCropLayout({ sourceWidth, sourceHeight, viewportSize, zoom, offsetX, offsetY }) {
  const preview = getSquareCropPreviewLayout({
    sourceWidth,
    sourceHeight,
    viewportSize,
    zoom,
    offsetX,
    offsetY,
  });

  const scale = preview.renderedWidth / sourceWidth;
  const sourceX = clamp(-preview.left / scale, 0, sourceWidth);
  const sourceY = clamp(-preview.top / scale, 0, sourceHeight);
  const sourceCropSize = Math.min(viewportSize / scale, sourceWidth - sourceX, sourceHeight - sourceY);

  return {
    sourceX,
    sourceY,
    sourceCropSize,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao ler a imagem seleccionada."));
    image.src = src;
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
