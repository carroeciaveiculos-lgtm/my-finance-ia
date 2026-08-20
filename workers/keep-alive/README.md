# Workers — Keep-Alive Supabase

Este diretório é reservado para o Cloudflare Worker responsável pelo **Keep-Alive** do banco de dados Supabase em produção.

---

## Propósito
Manter o banco de dados Supabase de produção acordado durante a fase de desenvolvimento e validação do sistema.

## Como Funciona
Um Cloudflare Worker com agendamento automático (**Cron Trigger**) executa uma consulta SQL leve (`SELECT 1`) no banco de dados a cada **48 horas**. Essa atividade periódica impede que o plano gratuito do Supabase entre em hibernação por inatividade (regra de pausa após 7 dias).

## Dependência da Etapa 1
A implementação real deste Worker (código JavaScript/TypeScript, configuração do wrangler e chaves de acesso) depende da criação e configuração do projeto Supabase na nuvem, que será realizada na **Etapa 1 (Estrutura + Auth + Deploy)**.

Por este motivo, na **Etapa 0 (Fundação)**, este diretório contém **apenas este documento descritivo**, sem nenhum código de implementação.
