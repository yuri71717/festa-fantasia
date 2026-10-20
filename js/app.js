let currentCourseFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  renderCostumes();
  setupEventListeners();
  checkSecretAdmin();
});

function renderCostumes() {
  const grid = document.getElementById('costumeGrid');
  const counterEl = document.getElementById('costumesCount');
  if (!grid) return;

  const allCostumes = FantasiaDB.getCostumes();

  const filtered = allCostumes.filter(item => {
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
        <i class="bi bi-camera" style="font-size: 2.2rem; color: var(--text-gray); display: block; margin-bottom: 8px;"></i>
        <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Nenhuma fantasia encontrada</h3>
        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 16px;">Seja o primeiro a publicar uma foto!</p>
        <button type="button" class="btn-cps-primary" onclick="openRegisterModal()">
          <i class="bi bi-camera-fill"></i> Publicar Fantasia
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => createCostumeCardHTML(item)).join('');
}

function createCostumeCardHTML(item) {
  const hasVoted = FantasiaDB.hasVoted(item.id);
  const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn);

  return `
    <article class="costume-item" data-id="${item.id}">
      <div class="photo-holder" onclick="viewCostumeDetails('${item.id}')">
        <img src="${item.foto}" alt="${escapeHtml(item.fantasia)}" class="photo-img" loading="lazy">
        <span class="badge-corner">${escapeHtml(item.curso || 'ETEC')}</span>
        ${isAdmin ? `
          <button type="button" class="btn-admin-card-delete" onclick="event.stopPropagation(); deleteCostumeAdmin('${item.id}')" title="Excluir como Administrador">
            <i class="bi bi-trash3-fill"></i> Excluir
          </button>
        ` : ''}
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
          <button type="button" class="btn-like ${hasVoted ? 'voted' : ''}" 
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

function handleVote(id, btnElement) {
  if (FantasiaDB.hasVoted(id)) {
    showToast('Você já curtiu esta fantasia!');
    return;
  }

  const result = FantasiaDB.vote(id);
  if (!result.success) {
    showToast(result.message || 'Erro ao registrar curtida.');
    return;
  }

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

function viewCostumeDetails(id) {
  const all = FantasiaDB.getCostumes();
  const item = all.find(c => c.id === id);
  if (!item) return;

  const modal = document.getElementById('detailsModal');
  const detailsContent = document.getElementById('detailsModalContent');
  if (!modal || !detailsContent) return;

  const hasVoted = FantasiaDB.hasVoted(item.id);
  const isAdmin = (typeof isAdminLoggedIn !== 'undefined' && isAdminLoggedIn);

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
      Aluno(a): <strong style="color: #ffffff;">${escapeHtml(item.aluno)}</strong>
    </div>

    <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 14px;">
      <div style="font-size: 1rem; font-weight: 700; color: #ffffff;">
        <span id="modal-votes-${item.id}">${item.votos || 0}</span> curtidas
      </div>
      <button type="button" class="btn-like ${hasVoted ? 'voted' : ''}" 
              style="padding: 8px 16px; font-size: 0.9rem;"
              onclick="handleVote('${item.id}', this)"
              ${hasVoted ? 'disabled' : ''}>
        <i class="bi ${hasVoted ? 'bi-heart-fill' : 'bi-heart'}"></i>
        ${hasVoted ? 'Votado' : 'Curtir'}
      </button>
    </div>
    ${isAdmin ? `
      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(248, 113, 113, 0.4); text-align: center;">
        <button type="button" class="btn-admin-table-delete" style="width: 100%; justify-content: center; padding: 10px; font-size: 0.88rem;" onclick="closeModal('detailsModal'); deleteCostumeAdmin('${item.id}');">
          <i class="bi bi-trash3-fill"></i> Excluir Foto
        </button>
      </div>
    ` : ''}
  `;

  openModal('detailsModal');
}

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

function setupEventListeners() {
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCourseFilter = btn.dataset.course;
      renderCostumes();
    });
  });
  const searchInput = document.getElementById('searchCostume');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderCostumes();
    });
  }
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
        showToast('Por favor, escolha um arquivo de imagem.');
        return;
      }

      showToast('Carregando foto...');
      try {
        await PhotoEditor.loadImage(file);
      } catch (err) {
        showToast('Erro ao abrir imagem: ' + err.message);
      }
    });
  }
  const formRegister = document.getElementById('formRegister');
  if (formRegister) {
    formRegister.addEventListener('submit', (e) => {
      e.preventDefault();

      const aluno = document.getElementById('inputAluno').value.trim();
      const curso = document.getElementById('selectCurso').value;
      const fantasia = document.getElementById('inputFantasia').value.trim();

      if (!aluno) {
        showToast('Informe o seu nome.');
        return;
      }

      if (!fantasia) {
        showToast('Informe o nome da fantasia.');
        return;
      }

      if (!PhotoEditor.hasImage()) {
        showToast('Selecione ou tire uma foto da fantasia.');
        return;
      }

      const fotoDataUrl = PhotoEditor.getImageDataUrl();
      if (!fotoDataUrl) {
        showToast('Erro ao processar a imagem.');
        return;
      }

      FantasiaDB.addCostume({
        aluno,
        curso,
        fantasia,
        foto: fotoDataUrl
      });

      closeModal('registerModal');
      resetRegisterForm();
      showToast('Fantasia publicada!');
      renderCostumes();
    });
  }
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active');
      if (activeModal) {
        closeModal(activeModal.id);
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      openAdminModal();
    }
  });
}

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