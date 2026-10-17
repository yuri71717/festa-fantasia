/**
 * Festa Fantasia ETEC - Painel do Administrador
 */

let isAdminLoggedIn = false;

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
    <div style="text-align: center; padding: 18px 10px;">
      <h3 style="color: #fff; margin-bottom: 6px; font-size: 1.2rem;">Painel do Administrador</h3>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">
        Digite a senha para gerenciar e moderar as fotos das fantasias.
      </p>

      <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" style="max-width: 300px; margin: 0 auto;">
        <div class="field-box" style="text-align: left;">
          <label class="field-label">Senha de Acesso</label>
          <input type="password" id="adminPasswordInput" class="input-text" placeholder="Senha padrão: admin" required autofocus>
        </div>
        <button type="submit" class="btn-solid" style="width: 100%; justify-content: center; margin-top: 10px;">
          Entrar
        </button>
      </form>
    </div>
  `;
}

function handleAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPasswordInput');
  const config = FantasiaDB.getConfig();

  if (input && input.value === (config.adminSenha || 'admin')) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('festa_admin_auth', 'true');
    showAdminDashboard();
    showToast('Acesso de administrador liberado.');
  } else {
    showToast('Senha incorreta.');
    if (input) input.value = '';
  }
}

function adminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('festa_admin_auth');
  showAdminLoginForm();
  showToast('Sessão encerrada.');
}

function showAdminDashboard() {
  const container = document.getElementById('adminModalContent');
  if (!container) return;

  const costumes = FantasiaDB.getCostumes();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
      <div>
        <h3 style="color: #fff; font-size: 1.15rem; margin: 0;">Moderação de Fantasias</h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${costumes.length} cadastros ativos</span>
      </div>
      <button class="btn-outline" onclick="adminLogout()" style="padding: 5px 12px; font-size: 0.8rem;">
        Sair
      </button>
    </div>

    <!-- Lista de Cadastros -->
    <div style="max-height: 420px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); text-align: left;">
            <th style="padding: 8px 10px;">Foto</th>
            <th style="padding: 8px 10px;">Fantasia / Aluno</th>
            <th style="padding: 8px 10px;">Curso</th>
            <th style="padding: 8px 10px;">Votos</th>
            <th style="padding: 8px 10px; text-align: right;">Ação</th>
          </tr>
        </thead>
        <tbody>
          ${costumes.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhuma fantasia cadastrada.</td></tr>' : costumes.map(c => `
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 8px 10px;">
                <img src="${c.foto}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">
              </td>
              <td style="padding: 8px 10px;">
                <strong style="color: #fff;">${escapeHtml(c.fantasia)}</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(c.aluno)}</div>
              </td>
              <td style="padding: 8px 10px; color: var(--text-muted);">${escapeHtml(c.curso)}</td>
              <td style="padding: 8px 10px; font-weight: 700; color: #fff;">${c.votos || 0}</td>
              <td style="padding: 8px 10px; text-align: right; white-space: nowrap;">
                <button class="btn-outline" onclick="deleteCostumeAdmin('${c.id}')" style="padding: 4px 8px; font-size: 0.78rem; color: #f87171; border-color: rgba(248, 113, 113, 0.3);">
                  Excluir
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Ferramentas de Backup e Limpeza -->
    <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
      <button class="btn-outline" onclick="exportDataFile()" style="font-size: 0.8rem; padding: 6px 12px;">
        Baixar Backup JSON
      </button>
      <button class="btn-outline" onclick="resetToSampleData()" style="font-size: 0.8rem; padding: 6px 12px;">
        Restaurar Exemplos
      </button>
      <button class="btn-outline" onclick="clearAllDataAdmin()" style="font-size: 0.8rem; padding: 6px 12px; color: #f87171;">
        Limpar Tudo
      </button>
    </div>
  `;
}

function deleteCostumeAdmin(id) {
  if (confirm('Tem certeza que deseja apagar esta fantasia?')) {
    FantasiaDB.deleteCostume(id);
    showToast('Fantasia removida.');
    showAdminDashboard();
    renderCostumes();
  }
}

function exportDataFile() {
  const jsonStr = FantasiaDB.exportBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-festa-fantasia-etec-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup salvo com sucesso.');
}

function resetToSampleData() {
  if (confirm('Deseja restaurar as fotos de exemplo?')) {
    FantasiaDB.resetData();
    showToast('Fotos de exemplo restauradas.');
    showAdminDashboard();
    renderCostumes();
  }
}

function clearAllDataAdmin() {
  if (confirm('ATENÇÃO: Deseja apagar todas as fantasias cadastradas?')) {
    localStorage.setItem('festa_fantasia_etec_itens', JSON.stringify([]));
    localStorage.setItem('festa_fantasia_etec_meus_votos', JSON.stringify([]));
    showToast('Todos os cadastros foram apagados.');
    showAdminDashboard();
    renderCostumes();
  }
}
