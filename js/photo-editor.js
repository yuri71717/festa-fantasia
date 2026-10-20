const PhotoEditor = (function () {
  const CANVAS_WIDTH = 640;
  const CANVAS_HEIGHT = 800;

  let container = null;
  let canvas = null;
  let ctx = null;
  let zoomSlider = null;
  let uploadPrompt = null;
  let loadedImg = null;
  let zoom = 1.0;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let isPinching = false;
  let pinchStartDist = 0;
  let pinchStartZoom = 1.0;

  function init() {
    container = document.getElementById('photoEditorBox');
    canvas = document.getElementById('editorCanvas');
    zoomSlider = document.getElementById('photoZoomSlider');
    uploadPrompt = document.getElementById('uploadPrompt');

    if (!canvas) return;
    ctx = canvas.getContext('2d');

    setupControls();
  }

  function setupControls() {
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        setZoom(parseFloat(e.target.value));
      });
    }
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.preventDefault();
        setZoom(zoom + 0.15);
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.preventDefault();
        setZoom(zoom - 0.15);
      });
    }
    const btnRotate = document.getElementById('btnRotatePhoto');
    if (btnRotate) {
      btnRotate.addEventListener('click', (e) => {
        e.preventDefault();
        rotate90();
      });
    }
    const btnReset = document.getElementById('btnResetCrop');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        resetPosition();
      });
    }
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
    }, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);
  }

  function loadImage(fileOrSrc) {
    return new Promise((resolve, reject) => {
      if (!fileOrSrc) {
        reject(new Error('Nenhum arquivo enviado'));
        return;
      }

      if (fileOrSrc instanceof File || fileOrSrc instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setupImage(img);
            resolve();
          };
          img.onerror = () => reject(new Error('Erro ao abrir imagem'));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(fileOrSrc);
      } else if (typeof fileOrSrc === 'string') {
        const img = new Image();
        img.onload = () => {
          setupImage(img);
          resolve();
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = fileOrSrc;
      }
    });
  }

  function setupImage(img) {
    loadedImg = img;
    zoom = 1.0;
    offsetX = 0;
    offsetY = 0;
    rotation = 0;

    if (zoomSlider) {
      zoomSlider.value = '1';
    }

    if (uploadPrompt) uploadPrompt.style.display = 'none';
    if (container) container.style.display = 'block';

    clampAndDraw();
  }

  function getEffectiveDimensions() {
    if (!loadedImg) return { effW: CANVAS_WIDTH, effH: CANVAS_HEIGHT };
    const isSideways = (rotation === 90 || rotation === 270);
    const effW = isSideways ? loadedImg.naturalHeight : loadedImg.naturalWidth;
    const effH = isSideways ? loadedImg.naturalWidth : loadedImg.naturalHeight;
    return { effW, effH };
  }

  function setZoom(val) {
    zoom = Math.max(1.0, Math.min(3.5, val));
    if (zoomSlider) {
      zoomSlider.value = zoom.toFixed(2);
    }
    clampAndDraw();
  }

  function rotate90() {
    rotation = (rotation + 90) % 360;
    offsetX = 0;
    offsetY = 0;
    clampAndDraw();
  }

  function resetPosition() {
    zoom = 1.0;
    offsetX = 0;
    offsetY = 0;
    rotation = 0;
    if (zoomSlider) zoomSlider.value = '1';
    clampAndDraw();
  }

  function clampAndDraw() {
    if (!loadedImg || !ctx) return;

    const { effW, effH } = getEffectiveDimensions();
    const baseScale = Math.max(CANVAS_WIDTH / effW, CANVAS_HEIGHT / effH);
    const totalScale = baseScale * zoom;

    const drawnW = effW * totalScale;
    const drawnH = effH * totalScale;
    const maxOffsetX = Math.max(0, (drawnW - CANVAS_WIDTH) / 2);
    const maxOffsetY = Math.max(0, (drawnH - CANVAS_HEIGHT) / 2);

    offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
    offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));
    ctx.fillStyle = '#0c0c0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2 + offsetX, CANVAS_HEIGHT / 2 + offsetY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(
      loadedImg,
      -loadedImg.naturalWidth / 2,
      -loadedImg.naturalHeight / 2,
      loadedImg.naturalWidth,
      loadedImg.naturalHeight
    );
    ctx.restore();
  }
  function onMouseDown(e) {
    if (e.button !== 0 || !loadedImg) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging || !loadedImg) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = CANVAS_WIDTH / rect.width;

    const dx = (e.clientX - lastX) * ratio;
    const dy = (e.clientY - lastY) * ratio;

    offsetX += dx;
    offsetY += dy;

    lastX = e.clientX;
    lastY = e.clientY;

    clampAndDraw();
  }

  function onMouseUp() {
    isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';
  }
  function onTouchStart(e) {
    if (!loadedImg) return;
    if (e.touches.length === 1) {
      isDragging = true;
      isPinching = false;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      isPinching = true;
      pinchStartDist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      pinchStartZoom = zoom;
    }
  }

  function onTouchMove(e) {
    if (!loadedImg) return;
    e.preventDefault();

    if (isDragging && e.touches.length === 1) {
      const rect = canvas.getBoundingClientRect();
      const ratio = CANVAS_WIDTH / rect.width;

      const dx = (e.touches[0].clientX - lastX) * ratio;
      const dy = (e.touches[0].clientY - lastY) * ratio;

      offsetX += dx;
      offsetY += dy;

      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;

      clampAndDraw();
    } else if (isPinching && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      if (pinchStartDist > 0) {
        const factor = dist / pinchStartDist;
        setZoom(pinchStartZoom * factor);
      }
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0) {
      isDragging = false;
      isPinching = false;
    } else if (e.touches.length === 1) {
      isPinching = false;
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
  }

  function getImageDataUrl() {
    if (!loadedImg || !canvas) return null;
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  function hasImage() {
    return loadedImg !== null;
  }

  function reset() {
    loadedImg = null;
    zoom = 1.0;
    offsetX = 0;
    offsetY = 0;
    rotation = 0;

    if (ctx && canvas) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    if (container) container.style.display = 'none';
    if (uploadPrompt) uploadPrompt.style.display = 'block';
  }

  return {
    init,
    loadImage,
    getImageDataUrl,
    hasImage,
    reset,
    setZoom,
    rotate90,
    resetPosition
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  PhotoEditor.init();
});