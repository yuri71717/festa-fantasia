let isAdminLoggedIn = (sessionStorage.getItem('festa_admin_auth') === 'true');

function openAdminModal() {
  if (sessionStorage.getItem('festa_admin_auth') === 'true') {
    isAdminLoggedIn = true;
    showAdminDashboard();
  } else {
    showAdminLoginForm();
  }
  openModal('adminModal');
}

function showAdminLoginForm() {
  const container = document.getElementById('adminModalContent');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 12px 6px;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(178, 31, 36, 0.15); color: var(--cps-red); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 12px auto;">
        <i class="bi bi-shield-lock-fill"></i>
      </div>
      <h3 style="color: #fff; margin-bottom: 6px; font-size: 1.25rem;">Painel da Moderação</h3>
      <p style="color: var(--text-gray); font-size: 0.88rem; margin-bottom: 20px;">
        Exclua fotos ou postagens inadequadas do mural.
      </p>

      <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" style="max-width: 320px; margin: 0 auto; text-align: left;">
        <div class="field-box">
          <label class="field-label">Senha de Administrador</label>
          <input type="password" id="adminPasswordInput" class="input-text" placeholder="Digite a senha" required autofocus>
        </div>
        <button type="submit" class="btn-cps-primary" style="width: 100%; margin-top: 14px;">
          <i class="bi bi-unlock-fill"></i> Entrar
        </button>
      </form>
    </div>
  `;
}

function handleAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPasswordInput');
  const password = input ? input.value : '';
  const config = FantasiaDB.getConfig();

  if (password === (config.adminSenha || 'admin')) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('festa_admin_auth', 'true');
    showAdminDashboard();
    if (typeof renderCostumes === 'function') {
      renderCostumes();
    }
    showToast('Acesso de administrador concedido.');
  } else {
    showToast('Senha incorreta.');
    if (input) input.value = '';
  }
}

function adminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('festa_admin_auth');
  showAdminLoginForm();
  if (typeof renderCostumes === 'function') {
    renderCostumes();
  }
  showToast('Sessão encerrada.');
}

function showAdminDashboard() {
  const container = document.getElementById('adminModalContent');
  if (!container) return;

  const costumes = FantasiaDB.getCostumes();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
      <div>
        <h3 style="color: #fff; font-size: 1.15rem; margin: 0; font-weight: 800;">
          <i class="bi bi-shield-check" style="color: #4ade80;"></i> Painel de Moderação
        </h3>
        <span style="font-size: 0.8rem; color: var(--text-gray);">${costumes.length} fotos cadastradas</span>
      </div>
      <button type="button" class="btn-cps-outline" onclick="adminLogout()" style="padding: 6px 12px; font-size: 0.82rem;">
        Sair
      </button>
    </div>

    <div style="background: rgba(178, 31, 36, 0.1); border: 1px solid rgba(178, 31, 36, 0.3); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.82rem; color: #fca5a5;">
      <i class="bi bi-info-circle-fill"></i> Você também pode excluir fotos diretamente no mural através do botão <strong>Excluir</strong> nos cards.
    </div>

    <!-- Tabela de Fotos -->
    <div style="max-height: 420px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-gray); text-align: left; background: #14141a;">
            <th style="padding: 10px 8px;">Foto</th>
            <th style="padding: 10px 8px;">Aluno / Fantasia</th>
            <th style="padding: 10px 8px;">Curso</th>
            <th style="padding: 10px 8px; text-align: center;">Votos</th>
            <th style="padding: 10px 8px; text-align: right;">Ação</th>
          </tr>
        </thead>
        <tbody>
          ${costumes.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">Nenhuma fantasia publicada ainda.</td></tr>' : costumes.map(c => `
            <tr style="border-bottom: 1px solid var(--border-subtle);">
              <td style="padding: 8px;">
                <img src="${c.foto}" style="width: 44px; height: 50px; border-radius: 4px; object-fit: cover; background: #000; display: block;">
              </td>
              <td style="padding: 8px;">
                <strong style="color: #fff; font-size: 0.9rem;">${escapeHtml(c.fantasia)}</strong>
                <div style="font-size: 0.78rem; color: var(--text-gray);">${escapeHtml(c.aluno)}</div>
              </td>
              <td style="padding: 8px; color: var(--text-muted); font-size: 0.78rem;">${escapeHtml(c.curso)}</td>
              <td style="padding: 8px; font-weight: 700; color: #fff; text-align: center;">${c.votos || 0}</td>
              <td style="padding: 8px; text-align: right; white-space: nowrap;">
                <button type="button" class="btn-admin-table-delete" onclick="deleteCostumeAdmin('${c.id}')" title="Excluir">
                  <i class="bi bi-trash3-fill"></i> Excluir
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Ferramentas de Backup -->
    <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
      <button type="button" class="btn-cps-outline" onclick="exportDataFile()" style="font-size: 0.8rem; padding: 8px 12px;">
        <i class="bi bi-download"></i> Baixar Backup JSON
      </button>
      <button type="button" class="btn-cps-outline" onclick="clearAllData()" style="font-size: 0.8rem; padding: 8px 12px; color: #ef4444;">
        <i class="bi bi-trash"></i> Limpar Todas as Fotos
      </button>
    </div>
  `;
}

function deleteCostumeAdmin(id) {
  const costume = FantasiaDB.getCostumes().find(c => c.id === id);
  const descricao = costume ? `"${costume.fantasia}" de ${costume.aluno}` : 'esta fantasia';

  if (!confirm(`Deseja realmente excluir ${descricao}?`)) {
    return;
  }

  FantasiaDB.deleteCostume(id);
  showToast('Fantasia excluída com sucesso.');
  showAdminDashboard();
  if (typeof renderCostumes === 'function') {
    renderCostumes();
  }
}

function clearAllData() {
  if (confirm('Tem certeza de que deseja apagar TODAS as fotos cadastradas? Esta ação não pode ser desfeita.')) {
    FantasiaDB.clearAll();
    showToast('Todas as fotos foram removidas.');
    showAdminDashboard();
    if (typeof renderCostumes === 'function') {
      renderCostumes();
    }
  }
}

function exportDataFile() {
  const jsonStr = FantasiaDB.exportBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-festa-fantasia-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup gerado e baixado.');
}
