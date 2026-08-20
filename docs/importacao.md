# Guia de Importação e Conciliação — my-finance-ia

Este documento estabelece as regras e diretrizes para o módulo de importação de extratos bancários e conciliação financeira do sistema **my-finance-ia**.

---

## 1. Formatos de Arquivo Suportados

A importação de dados financeiros foi planejada para atender aos formatos mais comuns utilizados pelas instituições financeiras:

1. **Formatos Primários (Recomendados):**
   - **OFX (Open Financial Exchange):** Formato padrão de exportação dos bancos, estruturado especificamente para extratos financeiros com alta confiabilidade de datas, valores e identificadores de transação.
   - **CSV (Comma-Separated Values):** Formato tabular de planilha, amplamente disponível e de fácil validação estrutural.

2. **Formato Secundário com Plano B:**
   - **PDF (Extrato em Documento):** Disponibilizado como alternativa de conveniência quando o banco não oferece exportação em OFX ou CSV.

---

## 2. Regras do Plano B para Arquivos em PDF

Arquivos em formato PDF apresentam grandes variações de formatação visual entre diferentes instituições. Para proteger a integridade financeira do usuário, o sistema adota regras estritas de segurança:

- **Não adivinhação de dados:** O sistema nunca presume valores, datas ou sinais (positivo/negativo) quando o texto do documento estiver confuso, cortado ou em formato não reconhecido.
- **Fallback com erro claro:** Caso o leitor (parser) de PDF não consiga reconhecer com 100% de precisão as informações do arquivo, ele interrompe o processo e exibe uma mensagem amigável e clara explicando que o formato do documento não pôde ser interpretado com segurança.
- **Sugestão de alternativa:** A mensagem orienta o usuário a baixar o extrato em formato OFX ou CSV diretamente no internet banking do seu banco ou a realizar os lançamentos manualmente.
- **Marcação como "Não Importado":** O arquivo é categorizado explicitamente com o status `"não importado"`. Nenhum registro incorreto ou parcial é gravado no banco de dados.

---

## 3. Lista de Bancos Suportados

- A lista formal de bancos, instituições e layouts suportados nativamente será definida e implementada na **Etapa 3 (Lançamentos + Importação)**.
- O sistema será expandido progressivamente para garantir total compatibilidade e confiabilidade com os principais layouts do mercado financeiro nacional.

---

## 4. Princípios da Conciliação Bancária

A conciliação consiste no confronto entre as transações importadas do extrato e os lançamentos já registrados no sistema:

- **Correspondência Automática Segura (100% de Certeza):** Uma transação do extrato só é vinculada automaticamente a um lançamento existente se houver correspondência exata de valor, data correspondente e descrição compatível.
- **Fila de Revisão Manual:** Qualquer transação que apresente pequenas divergências (como centavos de diferença, datas com intervalo de dias ou descrições ambíguas) é enviada para a tela de revisão manual, onde o usuário toma a decisão final com um clique.
