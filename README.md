# Lara Iza

Sistema web desenvolvido para gerenciamento, visualização e análise de informações, com interface responsiva, recursos interativos e integração com o Supabase.

## Sobre o projeto

O Lara Iza é uma aplicação web desenvolvida utilizando tecnologias modernas de desenvolvimento front-end e serviços em nuvem.

O projeto foi estruturado para proporcionar uma experiência de utilização intuitiva, com organização de informações, visualização de dados por meio de gráficos, componentes interativos e integração com banco de dados.

A aplicação pode ser executada localmente para desenvolvimento e testes e também está preparada para publicação por meio do Netlify.

## Principais recursos

* Interface web responsiva;
* Sistema de navegação interativo;
* Integração com banco de dados Supabase;
* Consulta e gerenciamento de dados;
* Visualização de informações por meio de gráficos;
* Componentes e animações de interface;
* Execução em ambiente local;
* Versionamento utilizando Git e GitHub;
* Deploy e hospedagem utilizando Netlify.

## Tecnologias utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript

### Backend e banco de dados

* Supabase
* PostgreSQL

### Ferramentas de desenvolvimento

* Visual Studio Code
* Node.js
* npm
* Git
* GitHub

### Hospedagem

* Netlify

## Estrutura do projeto

A estrutura do projeto pode variar de acordo com a versão utilizada. De forma geral:

```text
LaraIza/
├── index.html
├── package.json
├── package-lock.json
├── script.js
├── styles.css
├── src/
├── public/
└── README.md
```

## Requisitos

Para executar o projeto localmente, é necessário possuir:

* Node.js;
* npm;
* Git;
* Visual Studio Code ou outro editor de código.

Para verificar as versões instaladas:

```bash
node --version
npm --version
git --version
```

## Instalação

Clone o repositório:

```bash
git clone https://github.com/amandaveras3/LaraIza.git
```

Acesse o diretório:

```bash
cd LaraIza
```

Instale as dependências:

```bash
npm install
```

## Execução local

Após a instalação das dependências, execute o projeto utilizando o comando configurado no `package.json`.

Em projetos configurados com Vite:

```bash
npm run dev
```

O terminal apresentará o endereço local da aplicação, normalmente:

```text
http://localhost:5173
```

## Configuração do Supabase

O Lara Iza utiliza o Supabase para armazenamento e gerenciamento dos dados da aplicação.

A configuração do projeto utiliza as seguintes informações:

```javascript
window.LARA_IZA_CONFIG = {
    SUPABASE_URL: "SUA_URL_DO_SUPABASE",
    SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA"
};
```

Os valores devem ser configurados de acordo com o projeto correspondente no Supabase.

### Segurança

A aplicação deve utilizar somente credenciais apropriadas para uso no cliente.

A `anon key` ou chave pública pode ser utilizada no front-end quando as permissões do banco estiverem corretamente configuradas.

A `Service Role Key` não deve ser inserida no código do front-end, no GitHub ou em qualquer arquivo disponibilizado publicamente.

O controle de acesso aos dados deve ser realizado utilizando as políticas de Row Level Security (RLS) do Supabase.

## Banco de dados

O banco de dados utilizado pelo projeto é baseado em PostgreSQL e disponibilizado pelo Supabase.

Para configurar o ambiente corretamente, é necessário garantir que:

1. O projeto do Supabase esteja ativo;
2. As tabelas utilizadas pela aplicação estejam criadas;
3. As colunas necessárias estejam configuradas;
4. As políticas de acesso estejam definidas;
5. A URL e a chave pública estejam corretamente configuradas.

## Visualização de dados

O sistema possui recursos para apresentação visual das informações, incluindo gráficos e indicadores.

Esses recursos permitem organizar e apresentar os dados de forma mais clara, facilitando sua interpretação e acompanhamento.

## Deploy

O projeto pode ser hospedado utilizando o Netlify e integrado diretamente ao repositório do GitHub.

O fluxo de publicação é:

```text
Alteração no código
        ↓
Teste local
        ↓
Git
        ↓
GitHub
        ↓
Netlify
        ↓
Build
        ↓
Aplicação publicada
```

Após a configuração da integração entre GitHub e Netlify, novos commits enviados para a branch configurada podem iniciar automaticamente um novo deploy.

## Atualização do projeto

Após realizar alterações no código, verifique os arquivos modificados:

```bash
git status
```

Adicione as alterações:

```bash
git add .
```

Crie um commit:

```bash
git commit -m "Atualiza projeto Lara Iza"
```

Envie as alterações para o GitHub:

```bash
git push origin main
```

Caso o projeto utilize outra branch como principal, substitua `main` pelo nome correspondente.

## Processo recomendado

O fluxo de desenvolvimento recomendado é:

```text
1. Alterar o código
2. Executar o projeto localmente
3. Testar as funcionalidades
4. Verificar o Console do navegador
5. Executar git status
6. Executar git add .
7. Criar o commit
8. Executar git push
9. Verificar o GitHub
10. Verificar o deploy no Netlify
```

## Solução de problemas

### Erro ao instalar dependências

Execute:

```bash
npm install
```

Se o problema persistir, verifique a versão do Node.js e as mensagens apresentadas pelo npm.

### Erro na conexão com o Supabase

Verifique:

* URL do projeto;
* chave pública;
* nome das tabelas;
* nomes das colunas;
* permissões;
* políticas RLS;
* erros exibidos no Console do navegador.

### Alterações não aparecem no site

Verifique se as alterações foram enviadas corretamente:

```bash
git status
git add .
git commit -m "Atualiza projeto"
git push
```

Em seguida, verifique o histórico de deploys no Netlify.

## Boas práticas

* Manter o código organizado e documentado;
* Utilizar commits objetivos e descritivos;
* Testar alterações antes do deploy;
* Não armazenar credenciais privadas no repositório;
* Utilizar políticas RLS no Supabase;
* Manter as dependências atualizadas;
* Verificar erros do navegador durante o desenvolvimento;
* Utilizar branches quando necessário para novas funcionalidades ou correções.

## Status do projeto

Em desenvolvimento.

O projeto pode receber novas funcionalidades, melhorias de interface, otimizações de desempenho e atualizações na estrutura de dados.

## Autoria

Projeto Lara Iza.

Repositório:

https://github.com/amandaveras3/LaraIza

## Licença

As condições de utilização, distribuição e modificação deste projeto devem seguir as definições estabelecidas pelos responsáveis pelo desenvolvimento.
