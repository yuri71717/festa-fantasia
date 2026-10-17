# Festa Fantasia - ETEC / Centro Paula Souza

Aplicativo web mobile-first para o mural de fotos e votação de fantasias dos alunos da ETEC (Centro Paula Souza).

---

## 📱 Otimizado para Celular (Mobile First)

- **Foco Mobile**: Design desenvolvido especificamente para a pegada do smartphone (largura vertical compacta, botões para alcance do polegar).
- **Cores Oficiais**: Preto institucional, branco e vermelho oficial do Centro Paula Souza (`#b21f24`).
- **Navegação Fixa Inferior**: Barra inferior com acesso rápido ao Mural e botão destacado para fotografar/publicar.
- **Câmera Direta**: Dispara a câmera do celular para tirar fotos instantaneamente (`capture="environment"`).
- **Cursos da ETEC**:
  - Administração
  - Desenvolvimento de Sistemas
  - Farmácia

---

## 💾 Persistência Real de Curtidas

- **Backend em PHP**: As curtidas e novas publicações são salvas diretamente no servidor (`api.php` e `dados.json`).
- Qualquer pessoa na mesma rede Wi-Fi que abrir o link (`http://192.168.5.239/festa-fantasia`) curte em tempo real e os votos são persistidos para todos.
- Sistema com fallback automático para `localStorage` caso rodando em servidor estático.

---

## 🔒 Administração Discreta

Para evitar poluição visual, o botão de admin não aparece na tela pública:
- Acesse via parâmetro na URL: `http://localhost/festa-fantasia/?admin=1`
- Ou atalho secreto de teclado: `Ctrl + Shift + A`
- Senha padrão: `admin`

---

## 🚀 Como Executar

### Via XAMPP:
1. Mantenha os arquivos na pasta `C:\xampp\htdocs\festa-fantasia`.
2. Certifique-se de que o **Apache** está rodando no painel do XAMPP.
3. No celular conectado ao mesmo Wi-Fi, acesse:
   `http://<SEU_IP_LOCAL>/festa-fantasia/`
