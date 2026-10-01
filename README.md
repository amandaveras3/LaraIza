# Lara Iza

Aplicação web desenvolvida para gerenciamento e visualização de dados, com interface responsiva, componentes interativos, gráficos e integração com o Supabase.

## Descrição

O Lara Iza é um projeto web desenvolvido com HTML, CSS e JavaScript, integrado ao Supabase para armazenamento e gerenciamento de dados.

A aplicação possui uma interface responsiva e recursos destinados à apresentação e análise das informações, incluindo gráficos, indicadores e elementos interativos.

O projeto utiliza GitHub para versionamento e Netlify para hospedagem e publicação da aplicação.

## Funcionalidades

* Interface responsiva para diferentes tamanhos de tela
* Interface interativa e dinâmica
* Integração com Supabase
* Armazenamento e consulta de dados
* Visualização de dados por meio de gráficos
* Indicadores e informações dinâmicas
* Animações e componentes interativos
* Execução em ambiente local
* Deploy integrado ao GitHub e Netlify

## Tecnologias

* HTML5
* CSS3
* JavaScript
* Supabase
* PostgreSQL
* Node.js
* npm
* Git
* GitHub
* Netlify

## Estrutura

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

A estrutura pode sofrer alterações conforme a evolução do projeto.

## Requisitos

Para executar o projeto localmente, é necessário instalar:

* Node.js
* npm
* Git
* Visual Studio Code

Verifique as versões instaladas:

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

Entre na pasta do projeto:

```bash
cd LaraIza
```

Instale as dependências:

```bash
npm install
```

## Execução

Execute o projeto em ambiente de desenvolvimento:

```bash
npm run dev
```

Depois, acesse o endereço informado pelo terminal.

Em uma configuração padrão do Vite:

```text
http://localhost:5173
```

## Configuração do Supabase

O projeto utiliza o Supabase como serviço de banco de dados e backend.

A aplicação utiliza uma configuração semelhante a:

```javascript
window.LARA_IZA_CONFIG = {
    SUPABASE_URL: "SUA_URL_DO_SUPABASE",
    SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA"
};
```

Substitua os valores pelos dados correspondentes ao projeto no Supabase.

### Segurança

A chave utilizada no código do cliente deve ser exclusivamente uma chave pública.

Não disponibilize no repositório:

* Service Role Key
* Senhas
* Tokens privados
* Credenciais administrativas

O controle de acesso aos dados deve ser realizado por meio das políticas de Row Level Security (RLS) do Supabase.

## Desenvolvimento

Durante o desenvolvimento, recomenda-se executar a aplicação localmente antes de enviar alterações ao repositório.

Fluxo de desenvolvimento:

```text
Alteração do código
       ↓
Execução local
       ↓
Testes
       ↓
Git
       ↓
GitHub
       ↓
Netlify
```

## Atualização do repositório

Após realizar alterações:

```bash
git status
```

Adicione os arquivos:

```bash
git add .
```

Crie um commit:

```bash
git commit -m "Atualiza projeto Lara Iza"
```

Envie para o GitHub:

```bash
git push origin main
```

## Deploy

O projeto está preparado para utilização com o Netlify.

Com a integração entre GitHub e Netlify configurada, o processo de publicação ocorre a partir dos commits enviados ao repositório.

Fluxo de publicação:

```text
GitHub
   ↓
Netlify
   ↓
Build
   ↓
Deploy
   ↓
Aplicação publicada
```

## Banco de dados

O banco de dados utiliza PostgreSQL por meio do Supabase.

Para o funcionamento correto da aplicação, o ambiente deve possuir:

* Tabelas necessárias;
* Colunas utilizadas pelo sistema;
* Relacionamentos necessários;
* Políticas RLS;
* Permissões adequadas;
* Configuração correta da API.

## Solução de problemas

### Dependências

Caso ocorram problemas com as dependências:

```bash
npm install
```

### Verificação do projeto

Para verificar arquivos modificados:

```bash
git status
```

Para verificar problemas durante a execução, consulte o terminal e o Console do navegador.

### Supabase

Em caso de problemas de conexão, verifique:

* URL do Supabase;
* chave pública;
* tabelas;
* colunas;
* permissões;
* políticas RLS;
* mensagens exibidas no Console.

### Netlify

Caso uma alteração não apareça no site publicado, verifique:

1. Se o commit foi enviado ao GitHub;
2. Se o Netlify iniciou um novo deploy;
3. Se o build foi concluído sem erros;
4. Se a branch utilizada pelo Netlify está correta;
5. Se as configurações de ambiente estão corretas.

## Boas práticas

* Manter o código organizado;
* Utilizar commits descritivos;
* Testar alterações localmente;
* Não publicar credenciais privadas;
* Configurar corretamente as políticas RLS;
* Manter as dependências atualizadas;
* Verificar erros antes do deploy.

## Status

Em desenvolvimento.

## Repositório

[GitHub — Lara Iza](https://github.com/amandaveras3/LaraIza)

## Licença

Projeto desenvolvido para fins acadêmicos e/ou de desenvolvimento. As condições de utilização, distribuição e modificação devem seguir as definições estabelecidas pelos responsáveis pelo projeto.
