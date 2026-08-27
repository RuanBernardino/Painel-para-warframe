# 🚀 Painel Warframe (Warframe Dashboard)

Um painel de controle web moderno e em tempo real para monitorar alertas, ciclos e eventos do **Warframe**, desenvolvido para auxiliar os jogadores a acompanharem o universo do jogo diretamente pelo navegador.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias modernas de desenvolvimento web:

* **[Next.js](https://next.js/)** (App Router) - Framework React para otimização e renderização de páginas.
* **TypeScript** - Tipagem estática para maior segurança e escalabilidade do código.
* **Tailwind CSS** - Estilização rápida e responsiva com foco em design futurista/dark.
* **API Comunitária do Warframe** (`api.warframestat.us`) - Integração para obtenção de dados em tempo real sobre o jogo.

---

## ✨ Funcionalidades

* 🔄 **Atualização em Tempo Real**: Consulta automática de dados de ciclos e eventos ativos.
* 🛡️ **Proxy de API Interno**: Estrutura segura de rotas utilizando o backend do Next.js (`route.ts`).
* 🎨 **Interface Estilizada**: Layout imersivo inspirado na estética tecnológica do jogo.

---

## 📦 Como Rodar o Projeto Localmente

Se você quiser clonar e rodar o projeto na sua máquina, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/RuanBernardino/Painel-para-warframe.git
   ```

2. **Entre na pasta do projeto:**
   ```bash
   cd Painel-para-warframe
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. Abra **http://localhost:3000** no seu navegador para ver o painel rodando!

---

## 📂 Estrutura Principal do Projeto

* `app/` - Contém as páginas principais e as rotas de API personalizadas (`api/warframe/[endpoint]`).
* `components/` - Componentes visuais reutilizáveis (cards de ciclo, alertas, timers, etc.).
* `lib/` - Funções utilitárias e gerenciamento de requisições à API.

---

> Desenvolvido por Ruan Bernardino.

## Fontes e créditos

- Estado global do jogo e API comunitária: [WarframeStat.us](https://warframestat.us/).
- Calendário de Arbitragens, fallback do World State e dados auxiliares: [browse.wf](https://browse.wf/about), por Calamity, Inc.
- Classificações de tiers de Arbitragem: Arbitration Goons, disponibilizadas pelo browse.wf.
