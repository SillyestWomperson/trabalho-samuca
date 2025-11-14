const express = require("express");
const db = require("../db");
const router = express.Router();

// GET - Listar todos os filmes com média de avaliações
router.get("/filmes", (req, res) => {
	db.all(
		`
    SELECT 
      f.id,
      f.titulo,
      f.sinopse,
      f.poster,
      f.data_criacao,
      f.data_atualizacao,
      ROUND(AVG(a.nota), 1) as media_notas,
      COUNT(a.id) as total_avaliacoes
    FROM filmes f
    LEFT JOIN avaliacoes a ON f.id = a.filme_id
    GROUP BY f.id
    ORDER BY f.data_criacao DESC
  `,
		(err, rows) => {
			if (err) {
				console.error("Erro ao listar filmes:", err);
				return res.status(500).json({ erro: "Erro ao listar filmes" });
			}
			res.json(rows);
		}
	);
});

// GET - Obter um filme específico
router.get("/filmes/:id", (req, res) => {
	const { id } = req.params;

	db.get(
		`
    SELECT 
      f.id,
      f.titulo,
      f.sinopse,
      f.poster,
      f.data_criacao,
      f.data_atualizacao,
      ROUND(AVG(a.nota), 1) as media_notas,
      COUNT(a.id) as total_avaliacoes
    FROM filmes f
    LEFT JOIN avaliacoes a ON f.id = a.filme_id
    WHERE f.id = ?
    GROUP BY f.id
  `,
		[id],
		(err, row) => {
			if (err) {
				console.error("Erro ao buscar filme:", err);
				return res.status(500).json({ erro: "Erro ao buscar filme" });
			}
			if (!row) {
				return res.status(404).json({ erro: "Filme não encontrado" });
			}
			res.json(row);
		}
	);
});

// POST - Criar novo filme
router.post("/filmes", (req, res) => {
	const { titulo, sinopse, poster } = req.body;

	if (!titulo || !sinopse || !poster) {
		return res.status(400).json({ erro: "Título, sinopse e poster são obrigatórios" });
	}

	db.run("INSERT INTO filmes (titulo, sinopse, poster) VALUES (?, ?, ?)", [titulo, sinopse, poster], function (err) {
		if (err) {
			console.error("Erro ao criar filme:", err);
			return res.status(500).json({ erro: "Erro ao criar filme" });
		}
		res.status(201).json({
			id: this.lastID,
			titulo,
			sinopse,
			poster,
			media_notas: null,
			total_avaliacoes: 0,
		});
	});
});

// PUT - Editar filme
router.put("/filmes/:id", (req, res) => {
	const { id } = req.params;
	const { titulo, sinopse, poster } = req.body;

	if (!titulo || !sinopse || !poster) {
		return res.status(400).json({ erro: "Título, sinopse e poster são obrigatórios" });
	}

	db.run(
		"UPDATE filmes SET titulo = ?, sinopse = ?, poster = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?",
		[titulo, sinopse, poster, id],
		function (err) {
			if (err) {
				console.error("Erro ao atualizar filme:", err);
				return res.status(500).json({ erro: "Erro ao atualizar filme" });
			}
			if (this.changes === 0) {
				return res.status(404).json({ erro: "Filme não encontrado" });
			}
			res.json({ mensagem: "Filme atualizado com sucesso", id });
		}
	);
});

// DELETE - Deletar filme
router.delete("/filmes/:id", (req, res) => {
	const { id } = req.params;

	db.run("DELETE FROM filmes WHERE id = ?", [id], function (err) {
		if (err) {
			console.error("Erro ao deletar filme:", err);
			return res.status(500).json({ erro: "Erro ao deletar filme" });
		}
		if (this.changes === 0) {
			return res.status(404).json({ erro: "Filme não encontrado" });
		}
		res.json({ mensagem: "Filme deletado com sucesso" });
	});
});

// GET - Listar avaliações de um filme
router.get("/filmes/:filme_id/avaliacoes", (req, res) => {
	const { filme_id } = req.params;

	db.all("SELECT * FROM avaliacoes WHERE filme_id = ? ORDER BY data_avaliacao DESC", [filme_id], (err, rows) => {
		if (err) {
			console.error("Erro ao listar avaliações:", err);
			return res.status(500).json({ erro: "Erro ao listar avaliações" });
		}
		res.json(rows);
	});
});

// POST - Criar nova avaliação
router.post("/avaliacoes", (req, res) => {
	const { filme_id, nota, comentario } = req.body;

	if (!filme_id || !nota || nota < 1 || nota > 5) {
		return res.status(400).json({ erro: "filme_id e nota (1-5) são obrigatórios" });
	}

	db.get("SELECT id FROM filmes WHERE id = ?", [filme_id], (err, row) => {
		if (err) {
			console.error("Erro ao verificar filme:", err);
			return res.status(500).json({ erro: "Erro ao verificar filme" });
		}
		if (!row) {
			return res.status(404).json({ erro: "Filme não encontrado" });
		}

		db.run(
			"INSERT INTO avaliacoes (filme_id, nota, comentario) VALUES (?, ?, ?)",
			[filme_id, nota, comentario || null],
			function (err) {
				if (err) {
					console.error("Erro ao criar avaliação:", err);
					return res.status(500).json({ erro: "Erro ao criar avaliação" });
				}
				res.status(201).json({
					id: this.lastID,
					filme_id,
					nota,
					comentario: comentario || null,
					data_avaliacao: new Date().toISOString(),
				});
			}
		);
	});
});

// DELETE - Deletar avaliação (admin)
router.delete("/avaliacoes/:id", (req, res) => {
	const { id } = req.params;

	db.run("DELETE FROM avaliacoes WHERE id = ?", [id], function (err) {
		if (err) {
			console.error("Erro ao deletar avaliação:", err);
			return res.status(500).json({ erro: "Erro ao deletar avaliação" });
		}
		if (this.changes === 0) {
			return res.status(404).json({ erro: "Avaliação não encontrada" });
		}
		res.json({ mensagem: "Avaliação deletada com sucesso" });
	});
});

module.exports = router;
