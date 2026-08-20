# Arquitetura do Sistema — my-finance-ia

Este documento descreve as camadas tecnológicas, os componentes e o fluxo de dados do sistema **my-finance-ia** em linguagem clara e acessível.

---

## 1. Visão Geral das Camadas

O sistema foi desenhado com arquitetura modular e moderna, priorizando simplicidade, alta performance, baixo custo inicial e facilidade de manutenção.

```
+-------------------------------------------------------------------------------+
|                                 USUÁRIA / NAVEGADOR                           |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
| 1. FRONTEND (Interface do Usuário)                                            |
|    - React + Vite + Tailwind CSS + Recharts                                    |
|    - Hospedado no Cloudflare Pages (my-finace-ia.goskip.app)                  |
+-------------------------------------------------------------------------------+
           |                                  |                        |
           | Chamadas de API / Dados          | Upload de Arquivos     | Conversas
           v                                  v                        v
+-----------------------+          +--------------------+    +------------------+
| 2. BACKEND / DATABASE |          | 3. ARMAZENAMENTO   |    | 4. ASSISTENTE IA |
|    (Supabase)         |          |    DE ARQUIVOS     |    |    (James)       |
|  - PostgreSQL         |          |    (Cloudflare R2) |    |  - Google Gemini |
|  - Auth (Usuários)    |          |  - Extratos PDF    |    |  - Apenas dados  |
|  - Edge Functions     |          |  - Comprovantes    |    |    reais do user |
+-----------------------+          +--------------------+    +------------------+
           ^
           |
           | Consulta leve a cada 48h (SELECT 1)
           |
+-------------------------------------------------------------------------------+
| 5. KEEP-ALIVE (Manutenção de Disponibilidade)                                 |
|    - Cloudflare Worker com Cron Trigger agendado                              |
|    - Mantém o banco Supabase acordado para testes sem atraso                  |
+-------------------------------------------------------------------------------+
```

---

## 2. Detalhamento de Cada Camada

### 1. Frontend (Interface do Usuário)

- **Tecnologias:** React, Vite, Tailwind CSS e biblioteca de gráficos Recharts.
- **Função:** Fornecer telas rápidas, limpas e responsivas para registro financeiro, visualização de gráficos de despesas, metas, investimentos e interação com o assistente James.
- **Hospedagem:** Cloudflare Pages no domínio `my-finace-ia.goskip.app`.

### 2. Backend, Autenticação e Banco de Dados (Supabase)

- **Tecnologias:** PostgreSQL relacional gerenciado, módulo de Autenticação (Supabase Auth) e Edge Functions.
- **Função:** Guardar os registros financeiros de forma segura com políticas de isolamento por usuário (Row Level Security - RLS), autenticar logins e processar regras de negócio no servidor.

### 3. Armazenamento de Arquivos (Cloudflare R2)

- **Tecnologias:** Cloudflare R2 Object Storage (compatível com S3).
- **Função:** Guardar com segurança arquivos pesados enviados pelo usuário, como extratos bancários em PDF, recibos e comprovantes, sem custo de transferência de saída (egress $0).

### 4. Assistente Inteligente James (Google Gemini)

- **Tecnologias:** Google Gemini via API.
- **Função:** Analisar os lançamentos e métricas financeiras reais para oferecer insights, tirar dúvidas e sugerir cortes de gastos ou reorganização de despesas, seguindo rigorosamente as 5 regras anti-alucinação.

### 5. Mecanismo Keep-Alive (Despertador do Banco)

- **Tecnologias:** Cloudflare Worker com Cron Trigger.
- **Função:** Realizar uma requisição leve e direta (`SELECT 1`) no banco de dados a cada 48 horas.
- **Fluxo do Keep-Alive:**
  ```
  [Cron Trigger a cada 48h] --> [Cloudflare Worker] --> [Consulta leve: SELECT 1] --> [Banco Supabase Mantido Ativo]
  ```
- **Objetivo:** Evitar que o banco de dados do plano gratuito entre em modo de suspensão por inatividade após 7 dias, garantindo que o aplicativo esteja sempre pronto para uso e testes imediatos.

---

## 3. Fluxo Típico de Dados

1. **Acesso do Usuário:** A usuária abre `my-finace-ia.goskip.app`, realiza login e visualiza o Dashboard com dados carregados do Supabase.
2. **Envio de Extrato:** A usuária faz upload de um extrato (CSV, OFX ou PDF). O arquivo é salvo no Cloudflare R2 e processado para gerar pré-lançamentos no Supabase.
3. **Consulta ao James:** A usuária pergunta sobre sua meta de economia. O sistema envia a pergunta e o resumo dos números reais ao Google Gemini, que retorna respostas práticas e fundamentadas.
4. **Manutenção Silenciosa:** Nos bastidores, o Worker do Keep-Alive roda a cada 48h mantendo toda a estrutura ativa na nuvem.
