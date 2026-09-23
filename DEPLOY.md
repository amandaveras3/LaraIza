# Lara Iza — publicação em produção

## O que foi preparado

- Supabase Auth com e-mail/senha.
- PostgreSQL + Row Level Security (RLS).
- Organização criada automaticamente para o primeiro usuário.
- Persistência do estado operacional no Supabase.
- Auditoria de alterações do estado.
- Tickets de suporte gravados no banco.
- Fallback local apenas para continuidade durante configuração/offline.
- Rodapé institucional com suporte, termos e privacidade.
- PWA, headers de segurança, CSP e redirecionamento SPA.
- Layout responsivo e acessibilidade básica.
- Build Netlify que injeta a configuração pública do Supabase sem gravá-la no repositório.

## O que você precisa me fornecer

1. **URL do projeto Supabase** — exemplo: `https://xxxxx.supabase.co`.
2. **Publishable key (ou anon key legado) do Supabase** — nunca envie `service_role`.
3. **E-mail oficial do suporte** que deverá aparecer no sistema.
4. **Nome jurídico/razão social da empresa**, se quiser que os Termos de Uso e Privacidade sejam ajustados ao responsável real.
5. **Domínio final**, se já existir (opcional; pode publicar primeiro no domínio `netlify.app`).
6. **Repositório GitHub/GitLab** ou acesso ao repositório onde deseja publicar (opcional; o ZIP também pode ser enviado diretamente ao Netlify).

## 1. Criar o projeto Supabase

No painel do Supabase, crie um novo projeto. Depois abra o **SQL Editor** e execute integralmente o arquivo `supabase-schema.sql` desta pasta.

Em seguida, em **Authentication → Providers**, mantenha Email habilitado. Para uma operação real, recomendamos manter a confirmação de e-mail habilitada.

Em **Authentication → URL Configuration**, cadastre:

- Site URL: o domínio definitivo do Netlify.
- Redirect URLs: o domínio definitivo e o endereço de deploy de preview, se necessário.

## 2. Configurar o Netlify

Na configuração do site, adicione estas variáveis de ambiente:

- `SUPABASE_URL` = URL do projeto Supabase.
- `SUPABASE_PUBLISHABLE_KEY` = publishable key/anon key do Supabase.
- `SUPPORT_EMAIL` = e-mail oficial de suporte.

Não coloque a `service_role` key no navegador, no GitHub ou no Netlify como variável exposta ao site.

## 3. Deploy

O projeto já possui `netlify.toml`. O build command é:

```bash
npm run build
```

O publish directory é:

```text
.
```

O build gera `supabase-config.js` a partir das variáveis do Netlify.

## 4. Primeiro acesso

1. Abra o site publicado.
2. Crie a primeira conta com o nome e e-mail do responsável.
3. Confirme o e-mail, caso a confirmação esteja habilitada.
4. Faça login.
5. O sistema cria automaticamente a organização e o registro inicial no banco.
6. Cadastre categorias, produtos, fornecedores, clientes e usuários conforme a operação real.

## 5. Importante antes do uso diário

- Não usar `service_role` no front-end.
- Não armazenar senha no `localStorage`.
- Trocar `suporte@laraiza.com` pelo endereço real.
- Revisar Termos de Uso e Política de Privacidade com o responsável jurídico/DPO da empresa.
- Configurar domínio próprio e HTTPS no Netlify.
- Criar política de backup/retention adequada ao negócio.
- Testar cadastro, edição, exclusão, entradas, saídas, exportações, login, logout e recuperação de senha antes da operação.
