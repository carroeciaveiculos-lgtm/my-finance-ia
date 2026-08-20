# Decisão 0002 — Mitigação da Pausa do Supabase Free Tier

- **Status:** Aceito
- **Data:** Agosto/2026

---

## Contexto e Problema

Os projetos hospedados no plano gratuito (Free Tier) do Supabase entram automaticamente em modo de pausa (hibernação) após 7 dias consecutivos sem atividade real no banco de dados (consultas SQL, chamadas de API ou execuções de Edge Functions).

Não há risco de perda de dados: quando o projeto recebe uma nova requisição, o Supabase reativa a instância em aproximadamente 30 segundos. Contudo, durante o desenvolvimento por etapas com intervalos de dias entre as validações e os testes de aceite da usuária, essa espera de 30 segundos dá a impressão de que o sistema está lento, instável ou quebrado.

---

## Decisão: Solução Adotada em 3 Camadas

Para garantir total disponibilidade e uma experiência agradável sem custos adicionais nesta fase, foi adotada uma estratégia em 3 camadas complementares:

### Camada 1: Desenvolvimento Local com Supabase CLI via Docker

- Utilizado no dia a dia de desenvolvimento.
- Funciona 100% no computador local, sem pausa por inatividade, sem limites de tráfego e com iteração instantânea.

### Camada 2: Keep-Alive na Nuvem via Cloudflare Worker

- Um Cloudflare Worker configurado com um Cron Trigger agendado para rodar a cada **48 horas**.
- O Worker executa uma consulta leve ao banco de dados (`SELECT 1`).
- Essa atividade periódica mantém a instância de produção na nuvem sempre ativa e acordada, permitindo que a usuária realize testes de aceite a qualquer momento com resposta imediata.

### Camada 3: Migração para o Plano Pro ($25/mês)

- Solução definitiva e oficial fornecida pelo Supabase.
- Elimina completamente o conceito de pausa por inatividade, amplia o armazenamento e os recursos de computação.

---

## Riscos e Observações

- O mecanismo de keep-alive é um paliativo técnico em relação às regras da plataforma gratuita.
- Caso o Cloudflare Worker falhe silenciosamente (por exemplo, por erro de rede ou chave expirada) ou se o Supabase alterar seus critérios de detecção de atividade real, o banco poderá pausar.
- A única garantia absoluta contra qualquer tipo de pausa é o plano pago Pro.
- Para o momento atual de desenvolvimento e validação da usuária, o arranjo de ambiente local + keep-alive a cada 48h atende integralmente ao objetivo com custo zero.

---

## Critérios para Migração para o Plano Pro ($25/mês)

A contratação do plano Pro oficial deverá ocorrer quando:

1. O sistema concluir o ciclo de validação pessoal e for lançado comercialmente como produto multi-usuário.
2. O volume de dados ou número de usuários ativos superar os limites do plano gratuito (500 MB de banco ou 50.000 MAU).
3. Qualquer atrito ou instabilidade operacional do plano gratuito comprometer a experiência de uso.
