# Banco de Alimentos Londrina

Sistema completo para gestão de **coletas (entradas)**, **distribuições (saídas)**, **estoque** e **relatórios** de um Banco de Alimentos. O projeto combina **Front‑end (HTML/Bootstrap/JS)** e **Back‑end (Node.js/Express/MySQL)**, com exportação de **CSV** e regras de negócio como **FIFO por validade** no consumo do estoque.

---

## Sumário
- [Visão Geral](#visão-geral)
- [Arquitetura & Tecnologias](#arquitetura--tecnologias)
- [Funcionalidades](#funcionalidades)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Banco de Dados (MySQL)](#banco-de-dados-mysql)
- [API (Endpoints)](#api-endpoints)
- [Fluxos Principais](#fluxos-principais)
- [Relatórios e Exportação CSV](#relatórios-e-exportação-csv)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Scripts NPM](#scripts-npm)
- [Boas Práticas e Tratamento de Erros](#boas-práticas-e-tratamento-de-erros)
- [Roadmap (Sugestões de Evolução)](#roadmap-sugestões-de-evolução)

---

## Visão Geral

O sistema cobre o ciclo completo de um banco de alimentos:

1. **Cadastro de Parceiros (Doadores)** e **Instituições** beneficiadas.
2. **Registro de Doações (Entradas)** com itens (descrição, quantidade, unidade, validade).
3. **Estoque** consolidado por item, com destaque para **validade** (vencido / vence em 7 dias / etc.).
4. **Registro de Saídas (Distribuições)** para instituições, **consumindo o estoque em FIFO por validade**.
5. **Relatórios** de Entradas, Saídas e **Prestação de Contas** (detalhada por instituição), com **exportação CSV**.

---

## Arquitetura & Tecnologias

**Front‑end**
- **HTML5** + **Bootstrap 5.3** (layout responsivo, componentes e ícones Bootstrap Icons)
- **JavaScript vanilla (ES6+)** para integrar com a API via `fetch`, renderizar tabelas, exportar CSV e aplicar regras de UI (datas, estados, etc.)

**Back‑end**
- **Node.js** + **Express** (servidor HTTP, rotas REST e estáticos)
- **mysql2/promise** (pool de conexões e queries)
- **dotenv** (configuração via `.env`)
- **cors** (habilita chamadas do front)

**Banco de Dados**
- **MySQL** com criação automática das tabelas na inicialização do servidor

---

## Funcionalidades

- **Cadastros**
  - Doadores/Parceiros (PJ/PF) – nome, documento, contato, endereço
  - Instituições – dados básicos e contato
- **Registro de Doações (Entradas)**
  - Seleção do doador, data da coleta, observações
  - Itens com quantidade/unidade e validade (opcional)
- **Estoque**
  - Consolidação por descrição + unidade
  - Cálculo do **próximo vencimento** e realce visual (vencido, vence hoje, em 7 dias, etc.)
  - Consulta de **lotes** por descrição
- **Saídas (Distribuições)**
  - Seleção de instituição e data
  - Consumo **FIFO por validade** dos lotes (falha se estoque insuficiente)
- **Relatórios**
  - **Entradas** por período (por parceiro e item)
  - **Saídas** por período (por instituição e item)
  - **Prestação de Contas** (detalhe por saída e itens)
  - **Exportação CSV** em todas as visões

---

## Estrutura de Pastas

```
.
├── index.html
├── cadastro-doador.html
├── cadastro-instituicao.html
├── registro-doacao.html
├── registro-saida.html
├── estoque.html
├── relatorios.html
├── relatorio-entradas.html
├── relatorio-saidas.html
├── relatorio-prestacao.html
├── assets/
│   ├── css/
│   │   └── style.css           # estilos personalizados (se aplicável)
│   └── js/
│       ├── cadastro-doador.js
│       ├── cadastro-instituicao.js
│       ├── registro-doacao.js
│       ├── registro-saida.js
│       ├── estoque.js
│       ├── relatorios.js
│       ├── relatorio-entradas.js
│       ├── relatorio-saidas.js
│       └── relatorio-prestacao.js
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── .env
```

> O **Express** serve os arquivos estáticos da raiz do projeto, então basta manter o front e o `server.js` na mesma pasta.

---

## Banco de Dados (MySQL)

As tabelas são criadas automaticamente ao subir o servidor:

- **doadores** (id, nome, documento, telefone, email, endereco)
- **instituicoes** (id, nome, razao_social, cnpj, telefone, endereco)
- **doacoes** (id, id_doador, data_doacao, observacoes)
- **itens_doacao** (id, id_doacao, descricao, quantidade DECIMAL(10,2), unidade, validade)
- **saidas** (id, id_instituicao, data_saida, observacoes)
- **itens_saida** (id, id_saida, descricao, quantidade DECIMAL(10,2), unidade, validade)

**Observações**
- As **entradas** somam no estoque a partir de `itens_doacao`.
- As **saídas** são registradas em `itens_saida` e **subtraem** das quantidades de `itens_doacao` seguindo **FIFO por validade**.

---

## API (Endpoints)

### Cadastros
- `GET /api/doadores` → Lista doadores (id, nome)
- `POST /api/doadores` → Cadastra doador
- `GET /api/instituicoes` → Lista instituições
- `POST /api/instituicoes` → Cadastra instituição

### Entradas (Doações)
- `POST /api/doacoes`  
  **Body**:
  ```json
  {
    "id_doador": 1,
    "data_doacao": "2025-10-30",
    "observacoes": "opcional",
    "itens": [
      {"descricao": "Arroz", "quantidade": 10, "unidade": "kg", "validade": "2026-01-01"},
      {"descricao": "Feijão", "quantidade": 5, "unidade": "kg"}
    ]
  }
  ```

### Estoque
- `GET /api/estoque` → Consolidação (descricao, unidade, quantidade_total, proximo_vencimento)
- `GET /api/estoque/lotes?descricao=Arroz` → Lotes por descrição (para inspeção e conferência)

### Saídas (Distribuições)
- `POST /api/saidas`  
  **Body**:
  ```json
  {
    "id_instituicao": 2,
    "data_saida": "2025-11-01",
    "observacoes": "entrega semanal",
    "itens": [
      {"descricao": "Arroz", "quantidade": 4, "unidade": "kg"},
      {"descricao": "Feijão", "quantidade": 2, "unidade": "kg"}
    ]
  }
  ```
  > O servidor irá consumir os **lotes de `itens_doacao`** dessa descrição, priorizando os com **validade mais próxima**. Se faltar estoque, a operação **falha** e nenhuma movimentação é confirmada.

### Relatórios
- `GET /api/relatorios/entradas?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/relatorios/saidas?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/relatorios/prestacao_instituicoes?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/relatorios/prestacao_detalhada?start=YYYY-MM-DD&end=YYYY-MM-DD`

---

## Fluxos Principais

### 1) Cadastro
- **Doadores**: `cadastro-doador.html` envia POST para `/api/doadores`.
- **Instituições**: `cadastro-instituicao.html` envia POST para `/api/instituicoes`.

### 2) Registro de Doação (Entrada)
- Em `registro-doacao.html`: selecionar doador e adicionar itens via modal.
- Envio em lote para `/api/doacoes`.
- O **estoque** é atualizado (soma por item).

### 3) Estoque
- `estoque.html` consulta `/api/estoque` e pinta alertas por validade:
  - **Vencido** (vermelho), **vence em ≤7 dias** (amarelo), **vence hoje**, etc.
- Botão **Ver Lotes** permite inspecionar lotes (`/api/estoque/lotes`).

### 4) Saída (Distribuição)
- Em `registro-saida.html`: selecionar instituição e itens para saída.
- POST para `/api/saidas` → consumo de estoque via **FIFO por validade**.

---

## Relatórios e Exportação CSV

### Gerador Central
- Em `relatorios.html`, escolha o período e clique em **Gerar** para abrir a página específica (Entradas, Saídas ou Prestação de Contas).
- Também é possível **exportar CSV** diretamente da central.

### Páginas de Relatórios
- **Entradas**: `relatorio-entradas.html` carrega `/api/relatorios/entradas` e permite **Exportar CSV**.
- **Saídas**: `relatorio-saidas.html` carrega `/api/relatorios/saidas` e permite **Exportar CSV**.
- **Prestação de Contas**: `relatorio-prestacao.html` consome `/api/relatorios/prestacao_detalhada`, **agrupa por saída** e oferece **Exportar CSV** com linhas no formato: `saida_id, data_saida, instituicao, descricao, quantidade, unidade, validade`.

---

## Como Rodar Localmente

1. **Pré‑requisitos**
   - Node.js 18+
   - MySQL 8+ (ou compatível)

2. **Clonar e instalar**
   ```bash
   npm install
   ```

3. **Criar o banco**
   ```sql
   CREATE DATABASE banco_alimentos CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   ```

4. **Configurar `.env`**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=banco_alimentos
   PORT=3000
   ```

5. **Iniciar o servidor**
   ```bash
   npm start
   ```
   Acesse: `http://localhost:3000`

6. **Fluxo para teste rápido**
   - Cadastre **um doador** e **uma instituição**.
   - Registre **uma doação** com 1–2 itens.
   - Verifique o **estoque**.
   - Registre **uma saída** com os mesmos itens (quantidade parcial).
   - Gere **relatórios** e **exporte CSV**.

---

## Variáveis de Ambiente

| Variável       | Padrão       | Descrição                              |
|----------------|--------------|----------------------------------------|
| `DB_HOST`      | `localhost`  | Host do MySQL                          |
| `DB_PORT`      | `3306`       | Porta do MySQL                         |
| `DB_USER`      | `root`       | Usuário do MySQL                       |
| `DB_PASSWORD`  | (vazio)      | Senha do MySQL                         |
| `DB_NAME`      | `banco_alimentos` | Nome do banco                    |
| `PORT`         | `3000`       | Porta do servidor Node                 |

---

## Scripts NPM

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## Boas Práticas e Tratamento de Erros

- **Transações** para operações críticas (ex.: registrar doação, registrar saída).
- **Rollback** automático em caso de erro para manter consistência.
- **FIFO por validade** ao consumir estoque nas saídas (otimiza giro e reduz perdas).
- **Validações** no front e no back (ex.: impedir saída sem itens, checar nome obrigatório em instituição, etc.).
- **Logs** simples por requisição e captura de exceções não tratadas.
- **CORS** habilitado para integração de front.

---

## Roadmap (Sugestões de Evolução)

- Autenticação e perfis de acesso (admin/usuário).
- Painel com **gráficos** (entradas x saídas, itens por categoria).
- **Categorias de itens** e **unidades padronizadas**.
- Upload/gestão de **comprovantes** (coleta/entrega).
- Integração com serviços de **deploy** e banco gerenciado.
- Testes automatizados (unitários e integração).

---