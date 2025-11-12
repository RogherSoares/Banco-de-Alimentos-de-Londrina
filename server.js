const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// MySQL connection pool (config from env)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'banco_alimentos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Log DB name at startup and ensure connection release
(async () => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT DATABASE() AS db');
      console.log('DB connected to:', rows && rows[0] ? rows[0].db : '(unknown)');
      await conn.query(`
        CREATE TABLE IF NOT EXISTS doadores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          documento VARCHAR(100),
          telefone VARCHAR(100),
          email VARCHAR(255),
          endereco TEXT
        ) ENGINE=InnoDB;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS instituicoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          razao_social VARCHAR(255),
          cnpj VARCHAR(100),
          telefone VARCHAR(100),
          endereco TEXT
        ) ENGINE=InnoDB;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS doacoes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_doador INT,
          data_doacao DATE,
          observacoes TEXT,
          FOREIGN KEY (id_doador) REFERENCES doadores(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS itens_doacao (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_doacao INT,
          descricao VARCHAR(255),
          quantidade DECIMAL(10,2),
          unidade VARCHAR(50),
          validade DATE,
          FOREIGN KEY (id_doacao) REFERENCES doacoes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS saidas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_instituicao INT,
          data_saida DATE,
          observacoes TEXT,
          FOREIGN KEY (id_instituicao) REFERENCES instituicoes(id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS itens_saida (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_saida INT,
          descricao VARCHAR(255),
          quantidade DECIMAL(10,2),
          unidade VARCHAR(50),
          validade DATE,
          FOREIGN KEY (id_saida) REFERENCES saidas(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
    } finally {
      conn.release();
    }
    console.log('DB: tabelas verificadas/criadas com sucesso');
  } catch (err) {
    console.error('DB init error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();

// Routes
app.get('/api/doadores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome FROM doadores ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('/api/doadores error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doadores', async (req, res) => {
  try {
    const { nome, documento, telefone, email, endereco } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO doadores (nome, documento, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)',
      [nome, documento || null, telefone || null, email || null, endereco || null]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error('/api/doadores POST error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Add GET list route for instituicoes (debug)
app.get('/api/instituicoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM instituicoes ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('/api/instituicoes GET error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Ensure POST logs insert result
app.post('/api/instituicoes', async (req, res) => {
  try {
    console.log('/api/instituicoes body:', req.body);
    const { nome, razao_social, cnpj, telefone, endereco } = req.body || {};
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Campo "nome" é obrigatório.' });

    const [result] = await pool.execute(
      'INSERT INTO instituicoes (nome, razao_social, cnpj, telefone, endereco) VALUES (?, ?, ?, ?, ?)',
      [nome.trim(), razao_social || null, cnpj || null, telefone || null, endereco || null]
    );

    console.log('/api/instituicoes insert result:', result);
    res.json({ id: result.insertId, affectedRows: result.affectedRows });
  } catch (err) {
    console.error('/api/instituicoes POST error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doacoes', async (req, res) => {
  try {
    const { id_doador, data_doacao, observacoes, itens } = req.body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'A doação precisa conter ao menos um item.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        'INSERT INTO doacoes (id_doador, data_doacao, observacoes) VALUES (?, ?, ?)',
        [id_doador || null, data_doacao || null, observacoes || null]
      );
      const idDoacao = result.insertId;

      for (const item of itens) {
        await conn.execute(
          'INSERT INTO itens_doacao (id_doacao, descricao, quantidade, unidade, validade) VALUES (?, ?, ?, ?, ?)',
          [idDoacao, item.descricao, item.quantidade, item.unidade || null, item.validade || null]
        );
      }

      await conn.commit();
      res.json({ id: idDoacao });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/estoque', async (req, res) => {
  try {
    const qDesc = req.query.descricao ? `%${req.query.descricao.trim()}%` : '%';
    const unidade = req.query.unidade ? req.query.unidade.trim() : null;
    const venc = req.query.venc ? req.query.venc.trim() : null; // 'expired' or number of days

    // Base: agrega por descrição/unidade e retorna menor validade (próximo vencimento)
    let sql = `SELECT descricao,
                      COALESCE(unidade,'') AS unidade,
                      SUM(quantidade) AS quantidade_total,
                      MIN(validade) AS proximo_vencimento
               FROM itens_doacao
               WHERE quantidade > 0 AND descricao LIKE ?`;
    const params = [qDesc];

    if (unidade) {
      sql += ' AND unidade = ?';
      params.push(unidade);
    }

    sql += ' GROUP BY descricao, unidade';

    // HAVING para filtro por vencimento (usa MIN(validade))
    if (venc) {
      if (venc === 'expired') {
        sql += ' HAVING MIN(validade) IS NOT NULL AND MIN(validade) < CURDATE()';
      } else {
        const n = Number(venc);
        if (!Number.isNaN(n)) {
          sql += ' HAVING MIN(validade) IS NOT NULL AND DATEDIFF(MIN(validade), CURDATE()) <= ?';
          params.push(n);
        }
      }
    }

    sql += ' ORDER BY descricao';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('/api/estoque error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// opcional: rota para ver lotes por descrição
app.get('/api/estoque/lotes', async (req, res) => {
  try {
    const descricao = req.query.descricao || '';
    const [rows] = await pool.query(
      `SELECT id, id_doacao, descricao, quantidade, unidade, validade FROM itens_doacao WHERE descricao = ? ORDER BY validade ASC`,
      [descricao]
    );
    res.json(rows);
  } catch (err) {
    console.error('/api/estoque/lotes error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Relatório de entradas (coletas) por parceiro / item
app.get('/api/relatorios/entradas', async (req, res) => {
  try {
    const start = req.query.start || '1970-01-01';
    const end = req.query.end || '9999-12-31';
    const [rows] = await pool.query(
      `SELECT
         DATE(d.data_doacao) AS data_doacao,
         doadores.nome AS parceiro,
         it.descricao,
         it.unidade,
         SUM(it.quantidade) AS total_quantidade
       FROM doacoes d
       JOIN doadores ON d.id_doador = doadores.id
       JOIN itens_doacao it ON it.id_doacao = d.id
       WHERE d.data_doacao BETWEEN ? AND ?
       GROUP BY DATE(d.data_doacao), doadores.id, it.descricao, it.unidade
       ORDER BY DATE(d.data_doacao) ASC`,
      [start, end]
    );
    res.json(rows);
  } catch (err) {
    console.error('/api/relatorios/entradas error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Posição de estoque (inventário agrupado) — alias para /api/estoque
app.get('/api/relatorios/posicao_estoque', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        it.descricao,
        it.unidade,
        SUM(it.quantidade) AS quantidade_total,
        MIN(it.validade) AS proximo_vencimento
      FROM itens_doacao it
      JOIN doacoes d ON d.id = it.id_doacao
      GROUP BY it.descricao, it.unidade
      ORDER BY (MIN(it.validade) IS NULL), MIN(it.validade) ASC, it.descricao ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('/api/relatorios/posicao_estoque error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Relatório de Saídas (Distribuições) por data e instituição
app.get('/api/relatorios/saidas', async (req, res) => {
  try {
    const start = req.query.start || '1970-01-01';
    const end = req.query.end || '9999-12-31';
    const [rows] = await pool.query(
      `SELECT
         DATE(s.data_saida) AS data_saida,
         i.nome AS instituicao,
         it.descricao,
         it.unidade,
         SUM(it.quantidade) AS total_quantidade
       FROM saidas s
       LEFT JOIN instituicoes i ON s.id_instituicao = i.id
       JOIN itens_saida it ON it.id_saida = s.id
       WHERE s.data_saida BETWEEN ? AND ?
       GROUP BY DATE(s.data_saida), i.id, it.descricao, it.unidade
       ORDER BY DATE(s.data_saida) ASC`,
      [start, end]
    );
    res.json(rows);
  } catch (err) {
    console.error('/api/relatorios/saidas error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Prestação de contas por instituição (resumo por instituição e item)
app.get('/api/relatorios/prestacao_instituicoes', async (req, res) => {
  try {
    const start = req.query.start || '1970-01-01';
    const end = req.query.end || '9999-12-31';
    const [rows] = await pool.query(
      `SELECT
         i.id AS instituicao_id,
         i.nome AS instituicao,
         it.descricao,
         it.unidade,
         SUM(it.quantidade) AS total_quantidade
       FROM saidas s
       JOIN instituicoes i ON s.id_instituicao = i.id
       JOIN itens_saida it ON it.id_saida = s.id
       WHERE s.data_saida BETWEEN ? AND ?
       GROUP BY i.id, it.descricao, it.unidade
       ORDER BY i.nome ASC, it.descricao ASC`,
      [start, end]
    );
    res.json(rows);
  } catch (err) {
    console.error('/api/relatorios/prestacao_instituicoes error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Relatório detalhado de prestação: lista de saídas com itens
app.get('/api/relatorios/prestacao_detalhada', async (req, res) => {
  try {
    const start = req.query.start || '1970-01-01';
    const end = req.query.end || '9999-12-31';
    const [rows] = await pool.query(
      `SELECT
         s.id AS id_saida,
         DATE(s.data_saida) AS data_saida,
         s.observacoes,
         i.id AS instituicao_id,
         i.nome AS instituicao,
         it.id AS item_id,
         it.descricao,
         it.quantidade,
         it.unidade,
         it.validade
       FROM saidas s
       LEFT JOIN instituicoes i ON s.id_instituicao = i.id
       JOIN itens_saida it ON it.id_saida = s.id
       WHERE s.data_saida BETWEEN ? AND ?
       ORDER BY s.data_saida ASC, s.id ASC`,
      [start, end]
    );
    res.json(rows);
  } catch (err) {
    console.error('/api/relatorios/prestacao_detalhada error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// global error handlers (improves log visibility)
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  process.exit(1);
});

// Register a saída (distribuição). Consumes stock (itens_doacao FIFO by validade)
app.post('/api/saidas', async (req, res) => {
  const { id_instituicao, data_saida, observacoes, itens } = req.body || {};
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Informe os itens da saída.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [r] = await conn.execute(
      'INSERT INTO saidas (id_instituicao, data_saida, observacoes) VALUES (?, ?, ?)',
      [id_instituicao || null, data_saida || null, observacoes || null]
    );
    const id_saida = r.insertId;

    for (const it of itens) {
      const descricao = (it.descricao || '').trim();
      const unidade = it.unidade || null;
      let qtdNeeded = Number(it.quantidade || 0);
      if (!descricao || qtdNeeded <= 0) continue;

      // get available lots (prioritize nearest validade)
      const [lots] = await conn.query(
        `SELECT id, quantidade, validade
         FROM itens_doacao
         WHERE descricao = ? AND quantidade > 0 AND (unidade = ? OR ? IS NULL OR ? = '')
         ORDER BY (validade IS NULL), validade ASC`,
        [descricao, unidade || '', unidade || null, unidade || '']
      );

      for (const lot of lots) {
        if (qtdNeeded <= 0) break;
        const available = Number(lot.quantidade || 0);
        if (available <= 0) continue;
        const use = Math.min(available, qtdNeeded);

        // record item_saida (records what was distributed from that lot)
        await conn.execute(
          'INSERT INTO itens_saida (id_saida, descricao, quantidade, unidade, validade) VALUES (?, ?, ?, ?, ?)',
          [id_saida, descricao, use, unidade, lot.validade || null]
        );

        // subtract from lot
        const newQty = available - use;
        await conn.execute('UPDATE itens_doacao SET quantidade = ? WHERE id = ?', [newQty, lot.id]);

        qtdNeeded -= use;
      }

      if (qtdNeeded > 0) {
        // not enough stock to fulfill this item -> rollback
        await conn.rollback();
        return res.status(400).json({ error: `Estoque insuficiente para "${descricao}". Faltam ${qtdNeeded}` });
      }
    }

    await conn.commit();
    res.json({ id_saida });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('/api/saidas POST error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// List saídas (with items) - useful for UI/validation
app.get('/api/saidas', async (req, res) => {
  try {
    const [saidas] = await pool.query(`
      SELECT s.id, s.id_instituicao, s.data_saida, s.observacoes, i.nome AS instituicao
      FROM saidas s
      LEFT JOIN instituicoes i ON s.id_instituicao = i.id
      ORDER BY s.data_saida DESC, s.id DESC
    `);

    // fetch items for all saidas in one query
    const ids = saidas.map(s => s.id);
    let items = [];
    if (ids.length) {
      const [rows] = await pool.query(
        `SELECT id_saida, descricao, quantidade, unidade, validade FROM itens_saida WHERE id_saida IN (?) ORDER BY id_saida, validade`,
        [ids]
      );
      items = rows;
    }

    // attach items
    const map = new Map();
    saidas.forEach(s => map.set(s.id, { ...s, itens: [] }));
    items.forEach(it => {
      if (map.has(it.id_saida)) map.get(it.id_saida).itens.push(it);
    });

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error('/api/saidas GET error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: err.message });
  }
});
