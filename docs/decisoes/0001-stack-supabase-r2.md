# Decisão 0001 — Stack Tecnológica: Supabase + Cloudflare R2

- **Status:** Aceito
- **Data:** Agosto/2026

---

## Contexto

O desenvolvimento do sistema **my-finance-ia** demanda uma infraestrutura moderna, ágil e de baixo custo inicial para suportar a fase de validação de uso pessoal, ao mesmo tempo em que oferece escalabilidade, segurança e robustez para futura evolução para produto comercial multi-usuário (SaaS).

---

## Decisão

Adotar a seguinte composição tecnológica integrada:

1. **Frontend:** React + Vite + Tailwind CSS + Recharts para construção de uma interface rica, responsiva e performática.
2. **Hospedagem Frontend:** Cloudflare Pages no domínio `my-finace-ia.goskip.app`.
3. **Backend / Banco de Dados / Auth / Storage:** Supabase (PostgreSQL relacional, sistema de autenticação completo, políticas de segurança RLS e Edge Functions em TypeScript/Deno).
4. **Armazenamento de Arquivos do Usuário:** Cloudflare R2 para armazenamento de extratos, comprovantes e anexos.
5. **Inteligência Artificial:** Google Gemini via API oficial para alimentar o assistente inteligente James.

---

## Consequências

### Positivas

- **Custo Inicial Zero:** Aproveitamento dos limites generosos dos planos gratuitos (Free Tier) do Supabase e Cloudflare R2.
- **Sem Custo de Egress em Arquivos:** O Cloudflare R2 não cobra taxas de transferência de saída de arquivos.
- **Segurança Nativa:** PostgreSQL com Row Level Security (RLS) permite isolamento total dos dados por usuário desde o início.
- **Produtividade e Agilidade:** Ecossistema React + Vite + Tailwind proporciona ciclo de desenvolvimento rápido e experiência de usuário fluida.

### Negativas / Limitações a Mitigar

- **Pausa por Inatividade no Supabase Free Tier:** O banco hiberna após 7 dias sem atividade, exigindo mecanismo de keep-alive.
- **Limites de Volume no Free Tier:** O banco gratuito é limitado a 500 MB e 50.000 MAU, necessitando migração para plano Pro no futuro quando virar produto com maior volume de dados.
- **Vendor Lock-in Moderado:** Uso de serviços gerenciados Supabase e Cloudflare, mitigado pela compatibilidade padrão com PostgreSQL e API compatível com S3.
