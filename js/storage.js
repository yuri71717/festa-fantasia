const STORAGE_KEYS = {
  FANTASIAS: 'festa_fantasia_itens',
  CONFIG: 'festa_fantasia_config',
  VOTOS: 'festa_fantasia_votos'
};

const CURSOS_ETEC = [
  'Administração',
  'Desenvolvimento de Sistemas',
  'Farmácia'
];

const DEFAULT_CONFIG = {
  titulo: 'Festa Fantasia ETEC',
  escola: 'ETEC - Centro Paula Souza',
  adminSenha: 'admin'
};

const DEFAULT_FANTASIAS = [];

class FantasiaDB {
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FANTASIAS)) {
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(DEFAULT_FANTASIAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VOTOS)) {
      localStorage.setItem(STORAGE_KEYS.VOTOS, JSON.stringify([]));
    }
  }

  static getConfig() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG)) || DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  }

  static updateConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    return updated;
  }

  static getCostumes() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FANTASIAS)) || [];
    } catch (e) {
      return [];
    }
  }

  static addCostume(costume) {
    const list = this.getCostumes();
    const novo = {
      id: costume.id || ('fantasia-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      aluno: (costume.aluno || '').trim(),
      curso: costume.curso || 'Desenvolvimento de Sistemas',
      fantasia: (costume.fantasia || '').trim(),
      foto: costume.foto,
      votos: costume.votos || 0,
      dataCriacao: costume.dataCriacao || new Date().toISOString()
    };
    list.unshift(novo);
    try {
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
    return novo;
  }

  static deleteCostume(id) {
    let list = this.getCostumes();
    list = list.filter(c => c.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao atualizar localStorage:', err);
    }
    return true;
  }

  static vote(id) {
    const list = this.getCostumes();
    const item = list.find(c => c.id === id);
    if (!item) {
      return { success: false, message: 'Fantasia não encontrada.' };
    }

    item.votos = (item.votos || 0) + 1;
    try {
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
    } catch (err) {
      console.error('Erro ao salvar votos:', err);
    }

    const meusVotos = this.getMyVotes();
    if (!meusVotos.includes(id)) {
      meusVotos.push(id);
      try {
        localStorage.setItem(STORAGE_KEYS.VOTOS, JSON.stringify(meusVotos));
      } catch (err) {}
    }

    return { success: true, newVotes: item.votos };
  }

  static hasVoted(id) {
    return this.getMyVotes().includes(id);
  }

  static getMyVotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOTOS)) || [];
    } catch (e) {
      return [];
    }
  }

  static exportBackup() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config: this.getConfig(),
      fantasias: this.getCostumes()
    };
    return JSON.stringify(data, null, 2);
  }

  static importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.fantasias)) {
        localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(data.fantasias));
        if (data.config) {
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
        }
        return { success: true, count: data.fantasias.length };
      }
      return { success: false, message: 'Arquivo inválido.' };
    } catch (e) {
      return { success: false, message: 'Erro ao processar: ' + e.message };
    }
  }

  static clearAll() {
    localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.VOTOS, JSON.stringify([]));
  }
}

FantasiaDB.init();
window.FantasiaDB = FantasiaDB;
