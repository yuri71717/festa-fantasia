/**
 * Festa Fantasia ETEC - Painel do Administrador / Moderação
 * Permite à direção / professores excluir fotos e cadastros inadequados
 * com exclusão real no servidor (api.php e dados.json).
 */

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
        Apenas a moderação pode excluir fotos impróprias ou duplicadas.
      </p>

      <form id="adminLoginForm" onsubmit="handleAdminLogin(event)" style="max-width: 320px; margin: 0 auto; text-align: left;">
        <div class="field-box">
          <label class="field-label">Senha de Administrador</label>
          <input type="password" id="adminPasswordInput" class="input-text" placeholder="Digite a senha (padrão: admin)" required autofocus>
        </div>
        <button type="submit" class="btn-cps-primary" style="width: 100%; margin-top: 14px;">
          <i class="bi bi-unlock-fill"></i> Acessar Moderação
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
    sessionStorage.setItem('festa_admin_password', password);
    showAdminDashboard();
    if (typeof renderCostumes === 'function') {
      renderCostumes();
    }
    showToast('Modo Administrador ativado! Agora você pode excluir fotos no feed e na lista.');
  } else {
    showToast('Senha incorreta.');
    if (input) input.value = '';
  }
}

function adminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('festa_admin_auth');
  sessionStorage.removeItem('festa_admin_password');
  showAdminLoginForm();
  if (typeof renderCostumes === 'function') {
    renderCostumes();
  }
  showToast('Sessão de administrador encerrada.');
}

function showAdminDashboard() {
  const container = document.getElementById('adminModalContent');
  if (!container) return;

  const costumes = FantasiaDB.getCostumes();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
      <div>
        <h3 style="color: #fff; font-size: 1.15rem; margin: 0; font-weight: 800;">
          <i class="bi bi-shield-check" style="color: #4ade80;"></i> Moderação Ativa
        </h3>
        <span style="font-size: 0.8rem; color: var(--text-gray);">${costumes.length} fotos publicadas</span>
      </div>
      <button class="btn-cps-outline" onclick="adminLogout()" style="padding: 6px 12px; font-size: 0.82rem;">
        Sair
      </button>
    </div>

    <div style="background: rgba(178, 31, 36, 0.1); border: 1px solid rgba(178, 31, 36, 0.3); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.82rem; color: #fca5a5;">
      <i class="bi bi-info-circle-fill"></i> Você também pode excluir fotos diretamente no mural através do botão vermelho <strong>Excluir</strong> em cada card.
    </div>

    <!-- Lista de Cadastros -->
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
          ${costumes.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">Nenhuma fantasia cadastrada.</td></tr>' : costumes.map(c => `
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
                <button type="button" class="btn-admin-table-delete" onclick="deleteCostumeAdmin('${c.id}')" title="Excluir do site">
                  <i class="bi bi-trash3-fill"></i> Excluir
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Ferramentas de Backup e Limpeza -->
    <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
      <button class="btn-cps-outline" onclick="exportDataFile()" style="font-size: 0.8rem; padding: 8px 12px;">
        <i class="bi bi-download"></i> Baixar Backup JSON
      </button>
      <button class="btn-cps-outline" onclick="resetToSampleData()" style="font-size: 0.8rem; padding: 8px 12px;">
        <i class="bi bi-arrow-counterclockwise"></i> Restaurar Iniciais
      </button>
    </div>
  `;
}

async function deleteCostumeAdmin(id) {
  const costume = FantasiaDB.getCostumes().find(c => c.id === id);
  const descricao = costume ? `"${costume.fantasia}" (Aluno: ${costume.aluno})` : 'esta fantasia';

  if (!confirm(`Tem certeza de que deseja EXCLUIR definitivamente ${descricao}?\n\nEsta ação apagará a foto do servidor e do mural.`)) {
    return;
  }

  showToast('Excluindo fantasia...');

  // 1. Exclui no servidor via api.php (deleta do dados.json e apaga arquivo de uploads/)
  try {
    const res = await fetch('api.php?action=delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        senha: sessionStorage.getItem('festa_admin_password') || 'admin'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (!data.success) {
        console.warn('Aviso do servidor ao excluir:', data.message);
      }
    }
  } catch (err) {
    // Se estiver rodando estático (ex: GitHub Pages)
  }

  // 2. Remove do localStorage local
  FantasiaDB.deleteCostume(id);

  showToast('Fantasia excluída com sucesso!');
  showAdminDashboard();
  if (typeof renderCostumes === 'function') {
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
  showToast('Backup baixado com sucesso.');
}

function resetToSampleData() {
  if (confirm('Deseja restaurar as 6 fotos originais de exemplo e zerar os votos?')) {
    FantasiaDB.resetData();
    showToast('Fotos restauradas.');
    showAdminDashboard();
    if (typeof renderCostumes === 'function') {
      renderCostumes();
    }
  }
}
