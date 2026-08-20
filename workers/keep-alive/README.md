# Workers — Keep-Alive Supabase

Implementação oficial do **Cloudflare Worker** responsável por manter o banco de dados Supabase da nuvem ativo e evitar a hibernação (pausa por inatividade de 7 dias do plano gratuito).

---

## 1. Como Funciona

- **Cron Trigger:** Executa periodicamente a cada **48 horas** (`0 0 */2 * *`).
- **Chamada da Edge Function:** Dispara uma requisição autenticada diretamente para a Edge Function do Supabase (`GET /functions/v1/keep-alive`), que executa uma query real no PostgreSQL (`SELECT * FROM profiles`).
- **Registro de Logs:** Registra timestamp e status da execução via `console.log` para acompanhamento no Cloudflare Dash ou via CLI.

---

## 2. Estrutura dos Arquivos

```
workers/keep-alive/
├── wrangler.toml       # Configuração de cron e variáveis
├── src/
│   └── index.ts        # Código do Worker (scheduled cron + fetch handler)
└── README.md           # Instruções e documentação
```

---

## 3. Configuração de Variáveis de Ambiente

As variáveis devem ser configuradas no painel do Cloudflare Workers ou via CLI:
- `SUPABASE_URL`: URL do projeto Supabase (ex: `https://vnvoobfuslxthhyvojka.supabase.co`)
- `SUPABASE_ANON_KEY`: Chave anônima pública da API do Supabase

---

## 4. Comandos de Operação

### Teste Direto da Edge Function (Keep-Alive):
Para testar diretamente a Edge Function no Supabase:
```bash
curl -X GET "https://vnvoobfuslxthhyvojka.supabase.co/functions/v1/keep-alive" \
  -H "apikey: <SUA_SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUA_SUPABASE_ANON_KEY>"
```

Resposta esperada (HTTP 200):
```json
{
  "ok": true,
  "timestamp": "2026-08-20T21:40:00.000Z",
  "result": {
    "message": "Keep-alive executado com sucesso",
    "totalProfiles": 2,
    "queriedRows": 2,
    "dbStatus": "healthy"
  }
}
```

### Deploy do Cloudflare Worker:
```bash
npx wrangler deploy
```

### Acompanhamento de Logs do Worker em Tempo Real:
```bash
npx wrangler tail
```

### Teste Manual de Disparo via Worker HTTP:
Após o deploy do worker:
```bash
curl -X GET https://keep-alive-supabase.<seu-subdominio>.workers.dev
```
A resposta confirmará o status da requisição repassada para a Edge Function do Supabase com o payload retornado.
