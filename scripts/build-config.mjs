import { writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const support = process.env.SUPPORT_EMAIL || 'suporte@laraiza.com';

if (!url || !key) {
  const productionBuild = process.env.NETLIFY === 'true' || process.env.CI === 'true' || process.env.REQUIRE_SUPABASE === 'true';
  if (productionBuild) {
    console.error('ERRO: SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY precisam estar configuradas no ambiente de produção.');
    process.exit(1);
  }
  console.warn('AVISO: Supabase não configurado. O sistema será executado em modo local.');
}

const safe = (value) => JSON.stringify(value);
const output = `/* Generated at build time. Do not commit production credentials here. */\nwindow.LARA_IZA_CONFIG = {\n  SUPABASE_URL: ${safe(url)},\n  SUPABASE_ANON_KEY: ${safe(key)},\n  APP_NAME: 'Lara Iza',\n  SUPPORT_EMAIL: ${safe(support)}\n};\n`;
writeFileSync('supabase-config.js', output, 'utf8');
console.log('Supabase runtime configuration generated successfully.');
