# Teste local

1. Abra um terminal nesta pasta.
2. Execute `npm run dev` ou `python -m http.server 4173`.
3. Acesse `http://localhost:4173`.
4. Não use `file:///.../index.html` para validar a versão de produção.
5. Para publicação, configure no Netlify: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPPORT_EMAIL`.

O sistema agora trata a navegação por delegação de eventos, possui rotas para Suporte/Termos/Privacidade e não faz mais uma atribuição inválida à constante `save`.
