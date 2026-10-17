/**
 * Festa Fantasia ETEC - Aplicação Principal
 * Curtidas 100% persistentes salvas no servidor (api.php / dados.json)
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let currentCourseFilter = 'all';
let currentSearch = '';
let selectedPhotoBase64 = null;

async function initApp() {
  await loadServerData();
  setupEventListeners();
  checkSecretAdmin();
}

/**
 * Carrega os dados reais do servidor com as curtidas salvas
 */
async function loadServerData() {
  try {
    const res = await fetch('api.php?action=get');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.fantasias)) {
        localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(data.fantasias));
      }
    }
  } catch (e) {
    // Se não estiver em servidor PHP (ex: GitHub Pages), usa dados do localStorage
  }
  renderCostumes();
}

/**
 * Renderiza o mural de fantasias
 */
function renderCostumes() {
  const grid = document.getElementById('costumeGrid');
  const counterEl = document.getElementById('costumesCount');
  if (!grid) return;

  const allCostumes = FantasiaDB.getCostumes();

  let filtered = allCostumes.filter(item => {
    let matchCourse = true;
    if (currentCourseFilter !== 'all') {
      matchCourse = item.curso === currentCourseFilter;
    }

    let matchSearch = true;
    if (currentSearch.trim() !== '') {
      const term = currentSearch.toLowerCase();
      matchSearch = (
        (item.aluno && item.aluno.toLowerCase().includes(term)) ||
        (item.fantasia && item.fantasia.toLowerCase().includes(term)) ||
        (item.curso && item.curso.toLowerCase().includes(term))
      );
    }

    return matchCourse && matchSearch;
  });

  if (counterEl) {
    counterEl.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: 8px;">
        <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Nenhuma fantasia encontrada</h3>
        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 16px;">Seja o primeiro a postar uma foto neste curso!</p>
        <button class="btn-cps-primary" onclick="openRegisterModal()">
          Publicar Fantasia
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => createCostumeCardHTML(item)).join('');
}

/**
 * Gera o card da fantasia com visual básico e neutro
 */
function createCostumeCardHTML(item) {
  const hasVoted = FantasiaDB.hasVoted(item.id);

  return `
    <article class="costume-item" data-id="${item.id}">
      <div class="photo-holder" onclick="viewCostumeDetails('${item.id}')">
        <img src="${item.foto}" alt="${escapeHtml(item.fantasia)}" class="photo-img" loading="lazy">
        <span class="badge-corner">${escapeHtml(item.curso || 'ETEC')}</span>
      </div>

      <div class="item-details">
        <h3 class="item-title" onclick="viewCostumeDetails('${item.id}')">
          ${escapeHtml(item.fantasia)}
        </h3>
        <div class="item-student">
          ${escapeHtml(item.aluno)}
        </div>

        <div class="item-action-row">
          <div class="votes-indicator">
            <span id="votes-${item.id}">${item.votos || 0}</span> curtidas
          </div>
          <button class="btn-like ${hasVoted ? 'voted' : ''}" 
                  onclick="handleVote('${item.id}', this)"
                  ${hasVoted ? 'disabled' : ''}>
            <i class="bi ${hasVoted ? 'bi-heart-fill' : 'bi-heart'}"></i>
            ${hasVoted ? 'Votado' : 'Curtir'}
          </button>
        </div>
      </div>
    </article>
  `;
}

/**
 * Curtir fantasia (persistência real no servidor e no navegador)
 */
async function handleVote(id, btnElement) {
  if (FantasiaDB.hasVoted(id)) {
    showToast('Você já curtiu esta fantasia!');
    return;
  }

  let serverVotes = null;

  // 1. Envia para o servidor salvar no dados.json
  try {
    const res = await fetch('api.php?action=vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.newVotes === 'number') {
        serverVotes = data.newVotes;
      }
    }
  } catch (err) {
    // Modo offline/estático
  }

  // 2. Registra o voto e atualiza o contador na tela
  const result = FantasiaDB.vote(id, serverVotes);

  const votesSpan = document.getElementById(`votes-${id}`);
  if (votesSpan) {
    votesSpan.textContent = result.newVotes;
  }

  const modalVotesSpan = document.getElementById(`modal-votes-${id}`);
  if (modalVotesSpan) {
    modalVotesSpan.textContent = result.newVotes;
  }

  if (btnElement) {
    btnElement.classList.add('voted');
    btnElement.disabled = true;
    btnElement.innerHTML = `<i class="bi bi-heart-fill"></i> Votado`;
  }

  showToast('Curtida confirmada!');
}

/**
 * Visualizar foto ampliada
 */
function viewCostumeDetails(id) {
  const all = FantasiaDB.getCostumes();
  const item = all.find(c => c.id === id);
  if (!item) return;

  const modal = document.getElementById('detailsModal');
  const detailsContent = document.getElementById('detailsModalContent');
  if (!modal || !detailsContent) return;

  const hasVoted = FantasiaDB.hasVoted(item.id);

  detailsContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 14px;">
      <img src="${item.foto}" alt="${escapeHtml(item.fantasia)}" style="max-height: 420px; width: 100%; object-fit: contain; border-radius: 6px; background: #000;">
    </div>
    <div style="margin-bottom: 8px;">
      <span class="badge-course">${escapeHtml(item.curso)}</span>
    </div>
    <h2 style="font-size: 1.35rem; color: #ffffff; margin-bottom: 4px;">
      ${escapeHtml(item.fantasia)}
    </h2>
    <div style="color: var(--text-gray); font-size: 0.95rem; margin-bottom: 16px;">
      Participante: <strong style="color: #ffffff;">${escapeHtml(item.aluno)}</strong>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
      <div style="font-size: 1rem; font-weight: 700; color: #ffffff;">
        <span id="modal-votes-${item.id}">${item.votos || 0}</span> curtidas
      </div>
      <button class="btn-like ${hasVoted ? 'voted' : ''}" 
              style="padding: 8px 16px; font-size: 0.9rem;"
              onclick="handleVote('${item.id}', this)"
              ${hasVoted ? 'disabled' : ''}>
        <i class="bi ${hasVoted ? 'bi-heart-fill' : 'bi-heart'}"></i>
        ${hasVoted ? 'Você já votou' : 'Curtir'}
      </button>
    </div>
  `;

  openModal('detailsModal');
}

/**
 * Modais
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    const otherActive = document.querySelector('.modal-overlay.active');
    if (!otherActive) {
      document.body.style.overflow = '';
    }
  }
}

function openRegisterModal() {
  resetRegisterForm();
  openModal('registerModal');
}

function resetRegisterForm() {
  const form = document.getElementById('formRegister');
  if (form) form.reset();

  const fileInput = document.getElementById('costumePhotoInput');
  if (fileInput) fileInput.value = '';

  if (typeof PhotoEditor !== 'undefined') {
    PhotoEditor.reset();
  }
}

/**
 * Event Listeners
 */
function setupEventListeners() {
  // Filtros por Cursos
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCourseFilter = btn.dataset.course;
      renderCostumes();
    });
  });

  // Busca
  const searchInput = document.getElementById('searchCostume');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderCostumes();
    });
  }

  // Upload e Editor Interativo de Foto
  const fileInput = document.getElementById('costumePhotoInput');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const btnChangePhoto = document.getElementById('btnChangePhoto');

  if (uploadPrompt && fileInput) {
    uploadPrompt.addEventListener('click', () => fileInput.click());
  }

  if (btnChangePhoto && fileInput) {
    btnChangePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showToast('Por favor, envie um arquivo de imagem.');
        return;
      }

      showToast('Carregando foto...');
      try {
        await PhotoEditor.loadImage(file);
        showToast('Foto carregada! Arraste para posicionar.');
      } catch (err) {
        showToast('Erro ao abrir foto: ' + err.message);
      }
    });
  }

  // Formulário de Cadastro
  const formRegister = document.getElementById('formRegister');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();

      const aluno = document.getElementById('inputAluno').value.trim();
      const curso = document.getElementById('selectCurso').value;
      const fantasia = document.getElementById('inputFantasia').value.trim();

      if (!aluno) {
        showToast('Digite seu nome completo.');
        return;
      }

      if (!fantasia) {
        showToast('Digite o nome da fantasia.');
        return;
      }

      if (!PhotoEditor.hasImage()) {
        showToast('Por favor, adicione uma foto da fantasia.');
        return;
      }

      const fotoDataUrl = PhotoEditor.getImageDataUrl();
      if (!fotoDataUrl) {
        showToast('Erro ao processar imagem.');
        return;
      }

      showToast('Enviando...');

      // Tenta salvar via api.php no servidor
      try {
        const res = await fetch('api.php?action=add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aluno,
            curso,
            fantasia,
            foto: fotoDataUrl
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.fantasia) {
            FantasiaDB.addCostume(data.fantasia);
            closeModal('registerModal');
            resetRegisterForm();
            showToast('Fantasia publicada com sucesso!');
            await loadServerData();
            return;
          }
        }
      } catch (err) {
        // Fallback local
      }

      FantasiaDB.addCostume({
        aluno,
        curso,
        fantasia,
        foto: fotoDataUrl
      });

      closeModal('registerModal');
      resetRegisterForm();
      showToast('Fantasia publicada com sucesso!');
      renderCostumes();
    });
  }

  // Fechar no clique fora
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        const otherActive = document.querySelector('.modal-overlay.active');
        if (!otherActive) {
          document.body.style.overflow = '';
        }
      }
    });
  });

  // Mobile Bottom Navigation
  const mobileNavItems = document.querySelectorAll('.mobile-nav-bar .nav-item');
  mobileNavItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (target === 'feed') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Atalho de teclado secreto para Administrador: Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      openAdminModal();
    }
  });
}

/**
 * Permite acessar o Admin discretamente via URL: ?admin=1
 */
function checkSecretAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('admin') === '1') {
    setTimeout(openAdminModal, 300);
  }
}

function showToast(message) {
  const toast = document.getElementById('toastNotice');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
