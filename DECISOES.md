# DECISÕES DO SISTEMA — my-finance-ia

Documento de decisões arquiteturais, de produto e de infraestrutura do sistema **my-finance-ia**.

---

## a) Propósito (P1)

O sistema **my-finance-ia** tem como propósito inicial o **uso pessoal para validação prática** do modelo de gestão financeira inteligente e do assistente agente James. Após a validação completa de todas as etapas e funcionalidades, o sistema está desenhado para **evoluir para um produto multi-usuário (SaaS)** comercializável.

---

## b) Escopo v1 completo (P4)

O escopo da versão 1 (v1) contempla todos os módulos essenciais para uma gestão financeira pessoal de ponta a ponta:

1. **Receitas e Despesas:** Lançamentos, categorização, periodicidade e controle de fluxo.
2. **Metas Financeiras:** Definição de objetivos de curto, médio e longo prazo com acompanhamento de progresso.
3. **Dívidas:** Mapeamento de passivos, taxas de juros, saldo devedor e planos de amortização.
4. **Investimentos:** Acompanhamento de carteira, classes de ativos e rentabilidade.
5. **Consórcios:** Gestão de cotas, parcelas pagas, lances e contemplação.
6. **Seguros:** Controle de apólices, prêmios, coberturas e datas de renovação.
7. **Importação de Extratos:** Suporte primário a arquivos CSV e OFX, e suporte secundário a PDF com plano B de fallback seguro.
8. **Conciliação Bancária:** Confronto automático de alta precisão entre extratos e lançamentos manuais.
9. **Dashboard:** Visão consolidada em tempo real com gráficos interativos e indicadores de saúde financeira.
10. **Relatórios:** Geração de relatórios analíticos de fluxo de caixa, evolução patrimonial e orçamentos.
11. **Assistente James:** Agente conversacional inteligente baseado em inteligência artificial para orientação financeira, análise de gargalos e oportunidades.

---

## c) Stack Tecnológica

- **Frontend:** React + Vite + Tailwind CSS + Recharts (interface ágil, responsiva e com gráficos modernos).
- **Hospedagem Frontend:** Cloudflare Pages no domínio `myfinanceia.goskip.app`.
- **Backend / Banco de Dados / Auth / Storage:** Supabase (PostgreSQL relacional, Autenticação de usuários, Supabase Storage e Edge Functions Deno/TypeScript).
- **Armazenamento de Arquivos do Usuário:** Cloudflare R2 (armazenamento de objetos compatível com S3, sem custo de saída de dados).
- **Inteligência Artificial (Assistente James):** Google Gemini via API oficial.

---

## d) Limites Free Tier Verificados (Agosto/2026)

### Supabase Free Tier

- **Banco de Dados PostgreSQL:** 500 MB de armazenamento.
- **Usuários Ativos Mensais (MAU):** 50.000 usuários.
- **Armazenamento de Arquivos (Storage):** 1 GB.
- **Transferência de Dados (Egress):** 5 GB/mês.
- **Edge Functions:** 500.000 invocações/mês.
- **Projetos Ativos:** 2 projetos simultâneos.
- **Regra de Inatividade:** O projeto pausa automaticamente após **7 dias sem atividade real** no banco de dados.

### Cloudflare R2 Forever Free Tier

- **Armazenamento:** 10 GB de arquivos gratuitos para sempre.
- **Operações de Escrita (Class A):** 1.000.000 de operações/mês.
- **Operações de Leitura (Class B):** 10.000.000 de operações/mês.
- **Egress (Transferência de Saída):** $0 (totalmente gratuito, sem taxa de saída).

---

## e) Mitigação da Pausa do Supabase (Decisão de Infraestrutura)

### Problema

Projetos no plano gratuito do Supabase entram em modo de pausa (dormem) após 7 dias sem atividade real no banco de dados (consultas, chamadas de API ou Edge Functions). Não há nenhuma perda de dados — o banco apenas fica hibernando e reativa em aproximadamente 30 segundos ao receber uma nova requisição. Contudo, durante o processo de desenvolvimento em etapas, com intervalos de dias entre validações e testes de aceite da usuária, esse atraso de "acordar" causa uma percepção de lentidão ou de sistema quebrado.

### Solução Adotada (3 Camadas)

1. **Desenvolvimento Local com Supabase CLI via Docker:** Utilizado para o trabalho do dia a dia. Não tem pausa, não consome limites de nuvem e oferece iteração e testes instantâneos.
2. **Keep-Alive na Nuvem:** Um Cloudflare Worker configurado com Cron Trigger que executa uma consulta leve ao banco de dados (`SELECT 1`) a cada 48 horas. Isso mantém o ambiente de produção na nuvem sempre ativo e pronto para os testes de aceite da usuária sem surpresas ou atrasos.
3. **Plano Pro ($25/mês):** A solução definitiva e oficial para quando o sistema virar produto multi-usuário em produção ou caso o atrito e as limitações do plano gratuito incomodem.

### Observação de Risco

O mecanismo de keep-alive é um paliativo técnico em relação ao design do plano gratuito da plataforma. Se o Worker falhar silenciosamente ou se o Supabase alterar suas políticas sobre o que é contabilizado como atividade real, o projeto poderá pausar. A única garantia definitiva sem risco de pausa é a contratação do plano Pro oficial. Para a fase atual de validação, a combinação de ambiente local + keep-alive resolve a necessidade com custo zero.

---

## f) Regra Anti-Alucinação e Ética do James (5 Regras Obrigatórias)

Para garantir segurança e confiabilidade nas orientações fornecidas pelo assistente James, 5 regras fundamentais são aplicadas:

1. **Fidelidade absoluta aos dados reais:** O James só cita números, saldos, datas e categorias que realmente existem nos dados do usuário. Nunca inventa valores, percentuais, projeções ou dados fictícios.
2. **Ação prática obrigatória:** Toda resposta do James baseada nas leis financeiras vem acompanhada de pelo menos uma ação prática, clara e executável pelo usuário.
3. **Tom construtivo e sem falsas garantias:** O James nunca culpa ou repreende o usuário por decisões passadas e nunca promete, estima com certeza ou garante rentabilidades ou resultados futuros.
4. **Aviso educacional e recomendação profissional:** Toda orientação inclui a ressalva explícita de que se trata de conteúdo educacional que não substitui a consulta a um profissional especializado. No caso de investimentos e seguros, recomenda sempre a busca por um especialista habilitado.
5. **Papel de educador e organizador:** O James posiciona-se estritamente como um educador financeiro e organizador de rotina, jamais como um consultor ou analista de valores mobiliários regulado (ex.: CVM/Anbima).

---

## g) Plano B de Importação e Conciliação

### Importação de Extratos

- **Caminho Primário:** Importação via arquivos estruturados CSV e OFX, além do lançamento manual direto na tela.
- **Plano B para PDF:** Arquivos em formato PDF passam por parser inteligente. Caso o parser não consiga reconhecer com total clareza a estrutura ou os campos do documento, o sistema **não tenta adivinhar** nem gera dados parciais. Em vez disso, exibe uma mensagem de erro clara e amigável, sugere o uso de CSV/OFX ou lançamento manual, e marca o arquivo com o status `"não importado"`.

### Conciliação Bancária

- **Correspondência Automática Segura:** A vinculação automática entre extrato bancário e lançamentos do sistema só ocorre quando houver **100% de certeza** (coincidência exata de valor, data e descrição compatível).
- **Revisão Manual:** Qualquer transação com divergência ou dúvida é encaminhada para a fila de revisão manual do usuário. O sistema nunca presume ou inventa conciliações.

---

## h) LGPD e Privacidade

- **Fase Atual (Validação Pessoal):** Foco na segurança das credenciais, isolamento de chaves e proteção de dados confidenciais.
- **Fase Futura (Produto Multi-usuário):** Implementação obrigatória de políticas rigorosas de Row Level Security (RLS) no PostgreSQL, termos de uso e política de privacidade transparentes, mecanismos para exportação completa de dados e funcionalidade de exclusão definitiva de conta e dados pelo titular (direito ao esquecimento previsto na LGPD).

---

## i) Monitoramento de Custo do Gemini

- **Chave de API Dedicada:** Utilização de chave de API específica e controlada para o projeto.
- **Alertas de Consumo:** Configuração de alertas de teto de gastos no console de desenvolvedor do Google Cloud.
- **Revisão Mensal:** Acompanhamento mensal do volume de tokens utilizados e do custo operacional das consultas do assistente James.

---

## j) Plano de 12 Etapas com Dependências

O desenvolvimento do sistema está estruturado em 12 etapas sequenciais com dependências claras:

- **Etapa 0 — Fundação:** Decisões arquiteturais, esqueleto de pastas, ADRs e documentação inicial (esta etapa).
- **Etapa 1 — Estrutura + Auth + Deploy:** Configuração do projeto Supabase, autenticação de usuário e pipeline inicial de deploy.
- **Etapa 2 — Modelo de Dados + RLS:** Criação das tabelas no banco de dados com políticas de segurança por usuário.
- **Etapa 3 — Lançamentos + Importação:** Gestão de receitas, despesas e módulo de importação de extratos (CSV/OFX e fallback de PDF).
- **Etapa 4 — Dashboard:** Telas de visualização, gráficos consolidados e métricas de desempenho financeiro.
- **Etapa 5 — Metas:** Módulo de planejamento e acompanhamento de metas financeiras.
- **Etapa 6 — Dívidas / Investimentos / Consórcios / Seguros:** Gestão completa de patrimônio, passivos e contratos de proteção.
- **Etapa 7 — Conciliação Bancária:** Motor de conciliação automática com conferência e revisão manual.
- **Etapa 8 — Assistente James:** Integração com Google Gemini, interface conversacional e regras éticas anti-alucinação.
- **Etapa 9 — Gargalos → Oportunidades:** Motor de diagnóstico financeiro inteligente para transformar pontos de vazamento em economia e investimento.
- **Etapa 10 — Relatórios:** Exportação e visualização de relatórios detalhados periódicos.
- **Etapa 11 — Ciclo de Vida:** Funcionalidades de encerramento de ciclos, arquivamento e evolução contínua da conta.
