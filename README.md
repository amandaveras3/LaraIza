# 📦 Lara Iza | Sistema de Gestão de Estoque

<p align="center">
  <strong>Sistema interativo para gerenciamento e controle de estoque</strong>
  <br>
  Desenvolvido durante o Estágio Supervisionado
</p>

---

## 📋 Sobre o Projeto

O **Lara Iza | Sistema de Gestão de Estoque** é um projeto desenvolvido durante o período de **Estágio Supervisionado**, realizado em parceria com a **concedente de estágio**, com acompanhamento do programa de formação vinculado ao **Governo do Estado do Ceará**.

O sistema foi desenvolvido com o objetivo de proporcionar uma solução digital para auxiliar no **controle, organização e acompanhamento das informações relacionadas ao estoque**.

A proposta do projeto surgiu a partir do processo de levantamento de necessidades, análise de requisitos e planejamento da estrutura do sistema. A partir dessas etapas, iniciou-se o desenvolvimento de uma plataforma interativa voltada para facilitar atividades relacionadas ao gerenciamento de produtos, movimentações e demais informações administrativas.

> 🎓 **Contexto acadêmico:** este projeto integra as atividades práticas desenvolvidas durante o Estágio Supervisionado, possibilitando a aplicação de conhecimentos adquiridos durante a formação técnica e acadêmica em uma situação próxima à realidade profissional.

---

# 🚀 Funcionalidades

O sistema conta com diversas funcionalidades para tornar o gerenciamento do estoque mais organizado e interativo.

### 📊 Dashboard

O painel principal apresenta informações importantes do sistema em tempo real.

- 📦 Quantidade de produtos cadastrados;
- 🏬 Quantidade total de itens em estoque;
- ⚠️ Produtos com estoque baixo;
- 📈 Indicadores relacionados à saúde do estoque;
- 🚚 Quantidade de fornecedores cadastrados;
- 👥 Quantidade de funcionários e usuários;
- 🧑‍💼 Quantidade de clientes;
- 🗂️ Quantidade de categorias;
- 💰 Valor total do estoque;
- 📊 Gráficos e indicadores atualizados.

---

### 📦 Gestão de Produtos

Permite o gerenciamento completo dos produtos cadastrados.

- ➕ Cadastro de produtos;
- ✏️ Edição de informações;
- 🗑️ Exclusão de produtos;
- 🔍 Pesquisa de produtos;
- 🗂️ Organização por categorias;
- 📊 Controle de status;
- ⚠️ Identificação de estoque crítico;
- 📥 Reposição de estoque.

---

### 📥 Entradas e 📤 Saídas

O sistema permite registrar movimentações relacionadas ao estoque.

#### Entradas

- Registro de reposições;
- Atualização automática da quantidade;
- Registro das movimentações.

#### Saídas

- Registro de vendas ou retiradas;
- Seleção de produtos;
- Seleção de clientes;
- Validação da quantidade disponível;
- Atualização automática do estoque.

---

### 🗂️ Categorias

Gerenciamento das categorias utilizadas para organizar os produtos.

- ➕ Criar categorias;
- ✏️ Editar categorias;
- 🗑️ Excluir categorias;
- 🔗 Atualização dos produtos relacionados.

---

### 🚚 Fornecedores

Permite cadastrar e administrar informações relacionadas aos fornecedores.

- Cadastro de fornecedores;
- Edição de informações;
- Controle de status;
- Visualização das informações cadastradas.

---

### 👥 Clientes e Usuários

O sistema permite o gerenciamento de informações administrativas.

- Cadastro de clientes;
- Cadastro de usuários;
- Alteração de informações;
- Gerenciamento de dados do perfil.

---

# 📄 Relatórios

O sistema possui diferentes modelos de relatórios gerados a partir das informações atuais.

### 📊 Opções disponíveis

- 📅 Resumo mensal;
- 📦 Movimentações de estoque;
- ⚠️ Produtos abaixo do estoque mínimo;
- 🚚 Informações relacionadas aos fornecedores.

Os relatórios incluem:

- 📊 Gráficos;
- 📋 Tabelas;
- 📈 Indicadores;
- 📦 Dados atualizados do sistema.

Também é possível preparar os relatórios para **exportação em PDF**.

---

# 💾 Persistência de Dados

Por se tratar de um protótipo funcional, os dados são armazenados diretamente no navegador.

O sistema utiliza:

- `localStorage`
- `IndexedDB`

Isso permite que diversas informações permaneçam disponíveis mesmo após a atualização da página.

> ⚠️ A persistência utilizada neste projeto é voltada para fins de prototipagem e demonstração. Em uma implementação de produção, recomenda-se a utilização de um banco de dados e servidor dedicados.

---

# 🔐 Autenticação

O sistema possui um fluxo de autenticação para o protótipo.

### Recursos

- 🔑 Login;
- 📝 Cadastro de novos usuários;
- 💾 Sessão persistente;
- 👤 Personalização do perfil;
- 🖼️ Alteração de foto;
- 🚪 Encerramento de sessão com confirmação.

Ao encerrar a sessão, o sistema apresenta uma confirmação personalizada:

> **Confirmar encerramento da sessão**

Após a confirmação, a sessão é encerrada e o usuário retorna à tela de acesso.

---

# 🎨 Interface

A interface foi desenvolvida com foco em:

✨ **Usabilidade**  
📱 **Responsividade**  
🎯 **Organização visual**  
🌙 **Modo escuro**  
☀️ **Modo claro**  
🔍 **Pesquisa global**  
🔔 **Sistema de notificações**  
📊 **Visualização de dados**

A identidade visual utiliza uma interface moderna com elementos voltados para sistemas administrativos e de gerenciamento.

---

# 🛠️ Tecnologias Utilizadas

O projeto foi desenvolvido utilizando tecnologias web.

| Tecnologia | Utilização |
|---|---|
| 🌐 HTML5 | Estrutura das páginas |
| 🎨 CSS3 | Estilização e responsividade |
| ⚙️ JavaScript | Funcionalidades e interatividade |
| 💾 LocalStorage | Persistência local |
| 🗄️ IndexedDB | Banco de dados local |
| 📊 Gráficos | Visualização de informações |

---

# 🧭 Estrutura do Sistema

```text
📦 Lara Iza | Sistema de Estoque
│
├── 🏠 Dashboard
│   ├── Resumo do estoque
│   ├── Indicadores
│   ├── Produtos críticos
│   └── Gráficos
│
├── 📦 Produtos
│   ├── Cadastro
│   ├── Edição
│   ├── Exclusão
│   └── Reposição
│
├── 🗂️ Categorias
│
├── 📥 Entradas
│
├── 📤 Saídas
│
├── 🚚 Fornecedores
│
├── 👥 Clientes
│
├── 📊 Relatórios
│
├── 🔔 Alertas
│
└── ⚙️ Configurações
