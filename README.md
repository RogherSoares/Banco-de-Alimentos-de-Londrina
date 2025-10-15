# Banco de Alimento de Londrina

Sistema para digitalizar e otimizar o recebimento, armazenamento e distribuição de alimentos para instituições sociais em Londrina.

## 📅 Período do Projeto
- Início: 02/10/2025
- Término: 30/11/2025

## 🚀 Processo de Desenvolvimento (Scrum)
- Sprints quinzenais (2 semanas)
- Cerimônias: Daily (15min), Planning, Review (demo), Retrospective
- Quadro: Backlog → A Fazer → Em Progresso → Em Revisão → Pronto
- DoR: user story com descrição, critérios de aceitação, prioridade, responsáveis e estimativa
- DoD: código versionado, testes passando, PR aprovado, docs atualizados, demo/ambiente de testes

## 👥 Papéis
- Scrum Master / Líder: Mateus Yano
- Front-end: Rogher  Soares
- Back-end: João Vinicius
- Banco de Dados: João Vinicius / Rogher Soares
- Documentação / QA: Thaiago Emed

## 🧰 Tecnologias
- Front-end: HTML5, CSS3, Bootstrap, JavaScript (Vite)
- Back-end: Node.js + Express (JWT)
- Banco de Dados: MySQL (migrations/ORM)
- Testes: Jest + Supertest, Postman
- Docs: Swagger/OpenAPI

## 🗂 Estrutura de Pastas (sugerida)
```
/frontend   # app web (Vite/Bootstrap)
/backend    # Node+Express
/db         # migrações, seeds
/docs       # wireframes (Balsamiq), design (Figma), swagger, decisões
```

## 🔗 Links
- [Notion](https://tricolor-addition-8cd.notion.site/Projeto-de-Extens-o-Banco-de-Alimento-de-Londrina-27f2ef1439dc8166ae55dd8215c21e40?source=copy_link)
- [GitHub](https://github.com/RogherSoares/Banco-de-Alimentos-de-Londrina)
- [Figma](https://www.figma.com/proto/vtSDkYUu7dMzhl4z0LbfwO/Banco-de-Alimentos?node-id=0-1&t=pN4wvjtOmrDIEGtw-1)
- [Balsamiq](https://balsamiq.cloud/skbwbcu/pvb7az7)

## 🧱 Sprints (planejamento)
- Sprint 1 (02/10 → 15/10): base do sistema e autenticação (login, JWT, schema, login UI)
- Sprint 2 (16/10 → 29/10): cadastros (usuários, doadores, instituições) + doações
- Sprint 3 (30/10 → 12/11): estoque por lote, coletas, entregas, relatórios
- Sprint 4 (13/11 → 26/11): painel administrativo, qualidade, documentação e MVP

## ✅ Como rodar (exemplo)
1. Clone o repositório
2. Configure `.env` (DB credentials, JWT secret)
3. `npm install` em `/backend` e `/frontend`
4. `npm run dev` para subir localmente
5. Acesse `http://localhost:3000` (ajuste conforme setup)