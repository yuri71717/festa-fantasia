/**
 * Festa Fantasia ETEC - Módulo de Ajuste, Zoom e Enquadramento de Foto
 * Permite ao aluno arrastar (pan), aplicar zoom (slider ou pinça touch)
 * e girar a foto para enquadrar a fantasia perfeitamente.
 */

const PhotoCropper = (function () {
  let modal = null;
  let viewport = null;
  let cropImg = null;
  let zoomSlider = null;
  let btnZoomIn = null;
  let btnZoomOut = null;
  let btnRotate = null;
  let btnReset = null;
  let btnConfirm = null;

  let rawImg = null;
  let rawFile = null;
  let onConfirmCallback = null;
  let onCancelCallback = null;

  // Estado do enquadramento
  let scale = 1.0;
  let rotation = 0; // 0, 90, 180, 270
  let translateX = 0;
  let translateY = 0;
  let fitScale = 1.0;
  let baseW = 0;
  let baseH = 0;

  // Controle de arrasto (Touch e Mouse)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // Controle de pinça (Pinch-to-zoom)
  let isPinching = false;
  let pinchStartDist = 0;
  let pinchStartScale = 1.0;

  function init() {
    modal = document.getElementById('cropModal');
    viewport = document.getElementById('cropViewport');
    cropImg = document.getElementById('cropImage');
    zoomSlider = document.getElementById('cropZoomSlider');
    btnZoomIn = document.getElementById('btnZoomIn');
    btnZoomOut = document.getElementById('btnZoomOut');
    btnRotate = document.getElementById('btnRotatePhoto');
    btnReset = document.getElementById('btnResetCrop');
    btnConfirm = document.getElementById('btnConfirmCrop');

    if (!viewport || !cropImg) return;

    setupEvents();
  }

  function setupEvents() {
    // Zoom Slider
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        setZoom(parseFloat(e.target.value));
      });
    }

    // Botões de Zoom +/-
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => setZoom(scale + 0.15));
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => setZoom(scale - 0.15));
    }

    // Girar Foto
    if (btnRotate) {
      btnRotate.addEventListener('click', () => rotate90());
    }

    // Centralizar / Reset
    if (btnReset) {
      btnReset.addEventListener('click', () => resetAlignment());
    }

    // Confirmar Enquadramento
    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => confirmCrop());
    }

    // Eventos de Mouse (Desktop)
    viewport.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Zoom com scroll do mouse
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(scale + delta);
    }, { passive: false });

    // Eventos de Touch (Smartphones e Tablets)
    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    viewport.addEventListener('touchcancel', onTouchEnd);
  }

  /**
   * Abre o modal com a imagem para ajuste
   */
  function open(fileOrImage, onConfirm, onCancel) {
    onConfirmCallback = onConfirm;
    onCancelCallback = onCancel;

    if (!modal) init();

    if (fileOrImage instanceof File || fileOrImage instanceof Blob) {
      rawFile = fileOrImage;
      readAndDownscaleImage(fileOrImage).then((img) => {
        rawImg = img;
        startCropper();
      }).catch((err) => {
        if (typeof showToast === 'function') {
          showToast('Erro ao carregar a foto: ' + err.message);
        }
      });
    } else if (fileOrImage instanceof HTMLImageElement) {
      rawImg = fileOrImage;
      startCropper();
    } else if (typeof fileOrImage === 'string') {
      const img = new Image();
      img.onload = () => {
        rawImg = img;
        startCropper();
      };
      img.onerror = () => {
        if (typeof showToast === 'function') {
          showToast('Não foi possível carregar a imagem.');
        }
      };
      img.src = fileOrImage;
    }
  }

  function readAndDownscaleImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Limita resolução bruta para no máximo 1600px para garantir fluidez no celular
          const MAX_DIM = 1600;
          let w = img.width;
          let h = img.height;

          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);

            const downscaledImg = new Image();
            downscaledImg.onload = () => resolve(downscaledImg);
            downscaledImg.onerror = reject;
            downscaledImg.src = c.toDataURL('image/jpeg', 0.92);
          } else {
            resolve(img);
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function startCropper() {
    if (!rawImg || !viewport) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset de valores
    scale = 1.0;
    rotation = 0;
    translateX = 0;
    translateY = 0;

    // Aguarda um frame para ler dimensões reais do viewport na tela
    requestAnimationFrame(() => {
      recalculateBaseSize();
      cropImg.src = rawImg.src;
      updateTransform();
      if (zoomSlider) {
        zoomSlider.value = '1';
      }
    });
  }

  function recalculateBaseSize() {
    if (!rawImg || !viewport) return;

    const vW = viewport.clientWidth || 300;
    const vH = viewport.clientHeight || 375;

    const isSideways = (rotation === 90 || rotation === 270);
    const effW = isSideways ? rawImg.naturalHeight : rawImg.naturalWidth;
    const effH = isSideways ? rawImg.naturalWidth : rawImg.naturalHeight;

    fitScale = Math.max(vW / effW, vH / effH);

    baseW = rawImg.naturalWidth * fitScale;
    baseH = rawImg.naturalHeight * fitScale;

    cropImg.style.width = baseW + 'px';
    cropImg.style.height = baseH + 'px';
  }

  function setZoom(newScale) {
    scale = Math.max(1.0, Math.min(3.5, newScale));
    if (zoomSlider) {
      zoomSlider.value = scale.toFixed(2);
    }
    clampTranslation();
    updateTransform();
  }

  function rotate90() {
    rotation = (rotation + 90) % 360;
    translateX = 0;
    translateY = 0;
    scale = 1.0;
    if (zoomSlider) zoomSlider.value = '1';
    recalculateBaseSize();
    updateTransform();
  }

  function resetAlignment() {
    scale = 1.0;
    rotation = 0;
    translateX = 0;
    translateY = 0;
    if (zoomSlider) zoomSlider.value = '1';
    recalculateBaseSize();
    updateTransform();
  }

  /**
   * Garante que a foto não saia completamente da moldura de corte
   */
  function clampTranslation() {
    if (!viewport) return;
    const vW = viewport.clientWidth;
    const vH = viewport.clientHeight;

    const isSideways = (rotation === 90 || rotation === 270);
    const currentW = (isSideways ? baseH : baseW) * scale;
    const currentH = (isSideways ? baseW : baseH) * scale;

    const maxDragX = Math.max(0, (currentW - vW) / 2);
    const maxDragY = Math.max(0, (currentH - vH) / 2);

    translateX = Math.max(-maxDragX, Math.min(maxDragX, translateX));
    translateY = Math.max(-maxDragY, Math.min(maxDragY, translateY));
  }

  function updateTransform() {
    if (!cropImg) return;
    cropImg.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`;
  }

  // --- Handlers de Mouse ---
  function onMouseDown(e) {
    if (e.button !== 0) return; // Apenas clique esquerdo
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    viewport.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;
    clampTranslation();
    updateTransform();
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    if (viewport) viewport.style.cursor = 'grab';
  }

  // --- Handlers de Touch (Celular) ---
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      isPinching = false;
      dragStartX = e.touches[0].clientX - translateX;
      dragStartY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      isPinching = true;
      pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
    }
  }

  function onTouchMove(e) {
    e.preventDefault(); // Impede rolagem da página no celular

    if (isDragging && e.touches.length === 1) {
      translateX = e.touches[0].clientX - dragStartX;
      translateY = e.touches[0].clientY - dragStartY;
      clampTranslation();
      updateTransform();
    } else if (isPinching && e.touches.length === 2) {
      const currentDist = getTouchDist(e.touches[0], e.touches[1]);
      if (pinchStartDist > 0) {
        const factor = currentDist / pinchStartDist;
        setZoom(pinchStartScale * factor);
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
      dragStartX = e.touches[0].clientX - translateX;
      dragStartY = e.touches[0].clientY - translateY;
    }
  }

  function getTouchDist(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  /**
   * Renderiza a imagem final recortada exatamente como o usuário posicionou
   */
  function confirmCrop() {
    if (!rawImg || !viewport) return;

    const vW = viewport.clientWidth;
    const vH = viewport.clientHeight;

    // Resolução padrão do cartão mobile (proporção 4:5 vertical)
    const outW = 720;
    const outH = 900;
    const ratio = outW / vW;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    // Fundo escuro de segurança
    ctx.fillStyle = '#0c0c0f';
    ctx.fillRect(0, 0, outW, outH);

    ctx.save();
    // 1. Move para o centro do canvas proporcional à translação
    ctx.translate(outW / 2 + translateX * ratio, outH / 2 + translateY * ratio);
    // 2. Aplica a rotação escolhida
    ctx.rotate((rotation * Math.PI) / 180);
    // 3. Aplica o fator de escala do zoom e do ajuste inicial
    const totalScale = scale * ratio * fitScale;
    ctx.scale(totalScale, totalScale);

    // 4. Desenha a foto original centralizada
    ctx.drawImage(
      rawImg,
      -rawImg.naturalWidth / 2,
      -rawImg.naturalHeight / 2,
      rawImg.naturalWidth,
      rawImg.naturalHeight
    );
    ctx.restore();

    // Exporta imagem em JPEG compactado de alta qualidade (~60KB)
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);

    close();

    if (typeof onConfirmCallback === 'function') {
      onConfirmCallback(croppedBase64, rawImg);
    }
  }

  function cancel() {
    close();
    if (typeof onCancelCallback === 'function') {
      onCancelCallback();
    }
  }

  function close() {
    if (modal) {
      modal.classList.remove('active');
    }
    // Mantém o bloqueio de overflow se outro modal ainda estiver ativo
    const anyModalActive = document.querySelector('.modal-overlay.active');
    if (!anyModalActive) {
      document.body.style.overflow = '';
    }
  }

  return {
    init,
    open,
    cancel,
    confirmCrop,
    getRawImage: () => rawImg
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  PhotoCropper.init();
});
