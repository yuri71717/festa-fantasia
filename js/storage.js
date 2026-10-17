/**
 * Festa Fantasia ETEC - Gerenciador de Dados (LocalStorage)
 * Com as 6 fotos reais enviadas pelos alunos e cursos da ETEC
 */

const STORAGE_KEYS = {
  FANTASIAS: 'festa_fantasia_etec_itens_v7',
  CONFIG: 'festa_fantasia_etec_config_v7',
  VOTOS: 'festa_fantasia_etec_meus_votos_v7'
};

const CURSOS_ETEC = [
  'Administração',
  'Desenvolvimento de Sistemas',
  'Farmácia'
];

const DEFAULT_CONFIG = {
  titulo: 'Festa Fantasia ETEC',
  subtitulo: 'Mural de Fantasias e Votação dos Alunos',
  escola: 'ETEC - Centro Paula Souza',
  adminSenha: 'admin'
};

// As 6 fotos reais das fantasias:
const DEFAULT_FANTASIAS = [
  {
    id: 'fantasia-1',
    aluno: 'Lucas Silva',
    curso: 'Desenvolvimento de Sistemas',
    fantasia: 'Pennywise / Palhaço Dançarino',
    foto: 'assets/fantasia-1.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'fantasia-2',
    aluno: 'Pedro Henrique',
    curso: 'Administração',
    fantasia: 'Palhaço Clássico',
    foto: 'assets/fantasia-2.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'fantasia-3',
    aluno: 'Gabriel Souza',
    curso: 'Desenvolvimento de Sistemas',
    fantasia: 'Cabeludo Sorridente',
    foto: 'assets/fantasia-3.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'fantasia-4',
    aluno: 'Camila Rocha',
    curso: 'Farmácia',
    fantasia: 'Dora Aventureira',
    foto: 'assets/fantasia-4.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'fantasia-5',
    aluno: 'Matheus Costa',
    curso: 'Administração',
    fantasia: 'Coringa (The Joker)',
    foto: 'assets/fantasia-5.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  },
  {
    id: 'fantasia-6',
    aluno: 'Larissa Mendes',
    curso: 'Farmácia',
    fantasia: 'Palhaço Maquiagem Artística',
    foto: 'assets/fantasia-6.png',
    votos: 0,
    dataCriacao: new Date().toISOString()
  }
];

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
      id: costume.id || ('fantasia-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
      aluno: costume.aluno.trim(),
      curso: costume.curso || 'Desenvolvimento de Sistemas',
      fantasia: costume.fantasia.trim(),
      foto: costume.foto,
      votos: costume.votos || 0,
      dataCriacao: costume.dataCriacao || new Date().toISOString()
    };
    list.unshift(novo);
    localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
    return novo;
  }

  static updateCostume(id, data) {
    const list = this.getCostumes();
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
      return list[index];
    }
    return null;
  }

  static deleteCostume(id) {
    let list = this.getCostumes();
    list = list.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));
    return true;
  }

  static vote(id, serverVotes = null) {
    const list = this.getCostumes();
    const item = list.find(c => c.id === id);
    if (item) {
      if (typeof serverVotes === 'number') {
        item.votos = serverVotes;
      } else {
        item.votos = (item.votos || 0) + 1;
      }
      localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(list));

      const meusVotos = this.getMyVotes();
      if (!meusVotos.includes(id)) {
        meusVotos.push(id);
        localStorage.setItem(STORAGE_KEYS.VOTOS, JSON.stringify(meusVotos));
      }
      return { success: true, newVotes: item.votos };
    }
    return { success: false, message: 'Fantasia não encontrada.' };
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

  static compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Nenhum arquivo enviado'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 700;
          const MAX_HEIGHT = 700;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Falha ao processar imagem'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  static exportBackup() {
    const data = {
      version: '7.0',
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
      return { success: false, message: 'Erro ao processar arquivo: ' + e.message };
    }
  }

  static resetData() {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    localStorage.setItem(STORAGE_KEYS.FANTASIAS, JSON.stringify(DEFAULT_FANTASIAS));
    localStorage.setItem(STORAGE_KEYS.VOTOS, JSON.stringify([]));
  }
}

FantasiaDB.init();
window.HalloweenDB = FantasiaDB;
