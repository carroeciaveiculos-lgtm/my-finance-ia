# My Finance IA

Sistema inteligente de gestão financeira pessoal integrado com o assistente agente **James**.

---

## O que é o sistema?

O **My Finance IA** é uma solução completa e intuitiva de gestão financeira, desenvolvida para ajudar você a ter clareza total sobre o seu dinheiro. O sistema reúne em um só lugar o controle de:

- **Receitas e Despesas:** Registro e categorização simples do dia a dia.
- **Metas Financeiras:** Planejamento e acompanhamento do seu progresso.
- **Dívidas e Financiamentos:** Estratégias de amortização e redução de juros.
- **Investimentos, Consórcios e Seguros:** Visão integrada do seu patrimônio e contratos de proteção.
- **Importação de Extratos e Conciliação:** Leitura de extratos bancários (CSV, OFX e PDF) com conferência segura.
- **Dashboard e Relatórios:** Gráficos visuais e relatórios analíticos fáceis de entender.
- **Assistente James:** Um educador e organizador financeiro virtual inteligente, que responde dúvidas e identifica oportunidades de economia usando apenas os seus dados reais.

---

## Como rodar o projeto localmente

Para executar o sistema no seu computador, siga os passos simples abaixo:

1. **Pré-requisitos:** Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em seu computador.
2. **Clonar ou abrir a pasta do projeto:** Abra a pasta `my-finance-ia` no seu terminal ou editor de código.
3. **Instalar as dependências:**
   ```bash
   npm install
   ```
4. **Configurar as variáveis de ambiente:**
   - Copie o arquivo `.env.example` para `.env`
   - Preencha com as suas chaves do Supabase e do Google Gemini quando disponíveis.
5. **Iniciar o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```
6. **Acessar o aplicativo:** Abra o navegador e acesse o endereço informado no terminal (normalmente `http://localhost:5173`).

---

## Documentação do Projeto

Toda a documentação detalhada está organizada na pasta `docs/`:

- **[DECISOES.md](./DECISOES.md):** Registro oficial de todas as decisões de produto, arquitetura, limites e planejamento das 12 etapas.
- **[Arquitetura do Sistema](./docs/arquitetura.md):** Como as camadas (Frontend, Supabase, Cloudflare R2, Gemini e Keep-Alive) conversam entre si.
- **[Guia de Importação de Extratos](./docs/importacao.md):** Regras de formatos suportados, plano B para arquivos PDF e conciliação segura.
- **[Manual do Usuário](./docs/manual-usuario.md):** Guia amigável explicando cada funcionalidade para o usuário final.
- **[Registro de Decisões de Arquitetura (ADRs)](./docs/decisoes/):**
  - [0001 — Stack Supabase + Cloudflare R2](./docs/decisoes/0001-stack-supabase-r2.md)
  - [0002 — Mitigação da Pausa do Supabase Free Tier](./docs/decisoes/0002-keep-alive-supabase.md)

---

## Manutenção do Ambiente em Produção (Keep-Alive)

Para garantir que o ambiente de testes na nuvem fique sempre disponível sem atrasos ao abrir o aplicativo, o projeto conta com um mecanismo de **keep-alive** (um "despertador" automático via Cloudflare Worker que faz uma consulta leve ao banco a cada 48 horas). A estrutura foi preparada nesta Etapa 0 e a sua ativação funcional ocorre na Etapa 1.
