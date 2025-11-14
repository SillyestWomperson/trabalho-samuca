const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const DB_PATH = path.join(__dirname, "movies.db");

// Conecta no banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
	if (err) {
		console.error("Erro ao conectar ao banco de dados:", err);
	} else {
		console.log("Conectado ao SQLite em:", DB_PATH);
		initializeTables();
	}
});

// Função para inicializar tabelas
function initializeTables() {
	db.serialize(() => {
		// Tabela de filmes
		db.run(
			`
      CREATE TABLE IF NOT EXISTS filmes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo VARCHAR(255) NOT NULL,
        sinopse TEXT NOT NULL,
        poster VARCHAR(500) NOT NULL,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
			(err) => {
				if (err) {
					console.error("Erro ao criar tabela filmes:", err);
				} else {
					console.log('Tabela "filmes" pronta');
				}
			}
		);

		// Tabela de avaliações
		db.run(
			`
      CREATE TABLE IF NOT EXISTS avaliacoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filme_id INTEGER NOT NULL,
        nota INTEGER NOT NULL CHECK(nota >= 1 AND nota <= 5),
        comentario TEXT,
        data_avaliacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE
      )
    `,
			(err) => {
				if (err) {
					console.error("Erro ao criar tabela avaliacoes:", err);
				} else {
					console.log('Tabela "avaliacoes" pronta');
				}
			}
		);

		db.run(`CREATE INDEX IF NOT EXISTS idx_avaliacoes_filme_id ON avaliacoes(filme_id)`);
		db.run(`CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data_avaliacao DESC)`);

		db.get("SELECT COUNT(*) as count FROM filmes", (err, row) => {
			if (err) {
				console.error("Erro ao verificar filmes:", err);
			} else if (row.count === 0) {
				console.log("Inserindo filmes iniciais...");
				insertInitialData();
			}
		});
	});
}

function insertInitialData() {
	const filmes = [
		{
			titulo: "Womp Land",
			sinopse: "Um ladrão de gatos que rouba gatos raros para colecionadores descobre um plano maior.",
			poster: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2Fd1%2F2a%2F6a%2Fd12a6a974586ca7e95fd89a0b6538ded.jpg&f=1&nofb=1&ipt=dbf4658a05377bb21e5ac9e36a4a58f17c87d8cc78c33a48e1f7d55871bc3c34",
		},
	];

	filmes.forEach((filme) => {
		db.run(
			"INSERT INTO filmes (titulo, sinopse, poster) VALUES (?, ?, ?)",
			[filme.titulo, filme.sinopse, filme.poster],
			function (err) {
				if (err) console.error("Erro ao inserir filme:", err);
			}
		);
	});

	const avaliacoes = [{ filme_id: 1, nota: 5, comentario: "Plot twist incrível" }];

	avaliacoes.forEach((avaliacao) => {
		db.run(
			"INSERT INTO avaliacoes (filme_id, nota, comentario) VALUES (?, ?, ?)",
			[avaliacao.filme_id, avaliacao.nota, avaliacao.comentario],
			function (err) {
				if (err) console.error("Erro ao inserir avaliação:", err);
			}
		);
	});

	console.log("Dados iniciais inseridos com sucesso!");
}

module.exports = db;
