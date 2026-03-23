const express = require('express');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// conecta ao banco de dados SQLite
const db = new sqlite3.Database('./banco.db');

// cria a tabela de usuários caso não exista
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

// permite receber dados do formulário 
app.use(express.urlencoded({ extended: true }));

// libera os arquivos da pasta public 
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// rota principal: carrega o HTML e insere a lista de usuários
app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8', (err, html) => {
    if (err) {
      return res.send('Erro ao carregar a página.');
    }

    // busca todos os usuários cadastrados no banco
    db.all('SELECT * FROM usuarios', [], (erro, rows) => {
      if (erro) {
        return res.send('Erro ao buscar usuários.');
      }

      let lista = '';

      // monta a tabela com os dados
      rows.forEach((user) => {
        lista += `
          <tr>
            <td>${user.nome}</td>
            <td>${user.email}</td>
            <td>
              <a href="/excluir/${user.id}" class="btn-excluir">Excluir</a>
            </td>
          </tr>
        `;
      });

      // substitui no HTML a parte da lista
      const htmlFinal = html.replace('<!-- LISTA_USUARIOS -->', lista);
      res.send(htmlFinal);
    });
  });
});

// rota para cadastrar um novo usuário
app.post('/cadastrar', (req, res) => {
  const { nome, email } = req.body;

  db.run(
    'INSERT INTO usuarios (nome, email) VALUES (?, ?)',
    [nome, email],
    function (erro) {
      if (erro) {
        return res.send('Erro ao cadastrar usuário.');
      }

      // mensagem de sucesso + redirecionamento
      res.send(`
        <h2>Usuário cadastrado com sucesso!</h2>
        <p>Redirecionando para a página inicial...</p>
        <script>
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        </script>
      `);
    }
  );
});

// rota para excluir um usuário pelo id
app.get('/excluir/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM usuarios WHERE id = ?', [id], function (erro) {
    if (erro) {
      return res.send('Erro ao excluir usuário.');
    }

    res.redirect('/');
  });
});

// inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});