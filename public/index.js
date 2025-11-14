let filmeAtualId = null;
let filmes = [];

const filmesGrid = document.getElementById("filmesGrid");
const filmesEditavelList = document.getElementById("filmesEditavelList");
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

const modalAvaliacao = document.getElementById("modalAvaliacao");
const modalEdicao = document.getElementById("modalEdicao");
const closes = document.querySelectorAll(".close");

const formNovoFilme = document.getElementById("formNovoFilme");
const formAvaliacao = document.getElementById("formAvaliacao");
const formEdicaoFilme = document.getElementById("formEdicaoFilme");

const toast = document.getElementById("toast");

function mostrarPagina(nomePagina) {
	pages.forEach((page) => page.classList.remove("active"));
	const pagina = document.getElementById(nomePagina);
	if (pagina) pagina.classList.add("active");

	navBtns.forEach((btn) => btn.classList.remove("active"));
	document.querySelector(`[data-page="${nomePagina}"]`).classList.add("active");

	if (nomePagina === "admin") {
		carregarFilmesEditaveis();
	}
}

function mostrarToast(mensagem, tipo = "sucesso") {
	toast.textContent = mensagem;
	toast.className = `toast toast-${tipo} show`;

	setTimeout(() => {
		toast.classList.remove("show");
	}, 3000);
}

async function carregarFilmes() {
	try {
		const response = await fetch("/api/filmes");
		if (!response.ok) throw new Error("Erro ao carregar filmes");

		filmes = await response.json();
		renderizarFilmes();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao carregar filmes", "erro");
	}
}

function renderizarFilmes() {
	filmesGrid.innerHTML = "";

	filmes.forEach((filme) => {
		const mediaTexto = filme.media_notas
			? `<i class="fas fa-star"></i> ${filme.media_notas} (${filme.total_avaliacoes} avaliações)`
			: "Sem avaliações";

		const card = document.createElement("div");
		card.className = "filme-card";
		card.innerHTML = `
      <div class="filme-poster">
        <img src="${filme.poster}" alt="${filme.titulo}">
        <div class="filme-overlay">
          <button class="btn btn-primary" onclick="abrirModalAvaliacao(${filme.id})">
            <i class="fas fa-star"></i>
            Avaliar
          </button>
        </div>
      </div>
      <div class="filme-info">
        <h3>${filme.titulo}</h3>
        <p class="filme-sinopse">${filme.sinopse}</p>
        <div class="filme-rating">${mediaTexto}</div>
      </div>
    `;

		filmesGrid.appendChild(card);
	});
}

async function carregarFilmesEditaveis() {
	try {
		const response = await fetch("/api/filmes");
		if (!response.ok) throw new Error("Erro ao carregar filmes");

		const filmesLista = await response.json();
		renderizarFilmesEditaveis(filmesLista);
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao carregar filmes", "erro");
	}
}

function renderizarFilmesEditaveis(filmesList) {
	filmesEditavelList.innerHTML = "";

	if (filmesList.length === 0) {
		filmesEditavelList.innerHTML = "<p>Nenhum filme cadastrado ainda.</p>";
		return;
	}

	filmesList.forEach((filme) => {
		const item = document.createElement("div");
		item.className = "filme-admin-item";
		item.innerHTML = `
      <div class="filme-admin-info">
        <img src="${filme.poster}" alt="${filme.titulo}">
        <div>
          <h4>${filme.titulo}</h4>
          <p>${filme.sinopse.substring(0, 100)}...</p>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="abrirModalEdicao(${filme.id})">
        <i class="fas fa-pen"></i>
        Editar
      </button>
    `;
		filmesEditavelList.appendChild(item);
	});
}

formNovoFilme.addEventListener("submit", async (e) => {
	e.preventDefault();

	const titulo = document.getElementById("titulo").value;
	const sinopse = document.getElementById("sinopse").value;
	const poster = document.getElementById("poster").value;

	try {
		const response = await fetch("/api/filmes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ titulo, sinopse, poster }),
		});

		if (!response.ok) throw new Error("Erro ao criar filme");

		mostrarToast("Filme criado com sucesso!", "sucesso");
		formNovoFilme.reset();
		carregarFilmes();
		carregarFilmesEditaveis();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao criar filme", "erro");
	}
});

function abrirModalAvaliacao(filmeId) {
	filmeAtualId = filmeId;
	const filme = filmes.find((f) => f.id === filmeId);

	if (!filme) return;

	document.getElementById("modalFilmePoster").src = filme.poster;
	document.getElementById("modalFilmeTitulo").textContent = filme.titulo;
	document.getElementById("modalFilmeSinopse").textContent = filme.sinopse;

	formAvaliacao.reset();

	const labels = document.querySelectorAll(".stars-rating label");
	labels.forEach((label) => {
		label.style.color = "";
	});

	carregarAvaliacoes(filmeId);

	modalAvaliacao.style.display = "block";
}

function fecharModalAvaliacao() {
	modalAvaliacao.style.display = "none";
	filmeAtualId = null;
}

async function carregarAvaliacoes(filmeId) {
	try {
		const response = await fetch(`/api/filmes/${filmeId}/avaliacoes`);
		if (!response.ok) throw new Error("Erro ao carregar avaliações");

		const avaliacoes = await response.json();
		renderizarAvaliacoes(avaliacoes);
	} catch (erro) {
		console.error("Erro:", erro);
	}
}

function renderizarAvaliacoes(avaliacoes) {
	const avaliacoesList = document.getElementById("avaliacoesList");
	avaliacoesList.innerHTML = "";

	if (avaliacoes.length === 0) {
		avaliacoesList.innerHTML = '<p class="sem-avaliacoes">Nenhuma avaliação ainda.</p>';
		return;
	}

	avaliacoes.forEach((avaliacao) => {
		const item = document.createElement("div");
		item.className = "avaliacao-item";
		const data = new Date(avaliacao.data_avaliacao).toLocaleDateString("pt-BR");
		const estrelas = '<i class="fas fa-star"></i>'.repeat(avaliacao.nota);

		item.innerHTML = `
      <div class="avaliacao-header">
        <span class="avaliacao-stars">${estrelas}</span>
        <span class="avaliacao-data">${data}</span>
        <button class="btn-small btn-danger" onclick="deletarAvaliacao(${avaliacao.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      ${avaliacao.comentario ? `<p class="avaliacao-comentario">${avaliacao.comentario}</p>` : ""}
    `;
		avaliacoesList.appendChild(item);
	});
}

formAvaliacao.addEventListener("submit", async (e) => {
	e.preventDefault();

	const nota = document.querySelector('input[name="nota"]:checked')?.value;
	const comentario = document.getElementById("comentario").value;

	if (!nota) {
		mostrarToast("Selecione uma nota", "erro");
		return;
	}

	try {
		const response = await fetch("/api/avaliacoes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filme_id: filmeAtualId,
				nota: parseInt(nota),
				comentario: comentario || null,
			}),
		});

		if (!response.ok) throw new Error("Erro ao enviar avaliação");

		mostrarToast("Avaliação registrada com sucesso!", "sucesso");
		formAvaliacao.reset();
		carregarAvaliacoes(filmeAtualId);
		carregarFilmes();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao enviar avaliação", "erro");
	}
});

async function deletarAvaliacao(avaliacaoId) {
	if (!confirm("Deseja deletar esta avaliação?")) return;

	try {
		const response = await fetch(`/api/avaliacoes/${avaliacaoId}`, {
			method: "DELETE",
		});

		if (!response.ok) throw new Error("Erro ao deletar avaliação");

		mostrarToast("Avaliação deletada", "sucesso");
		carregarAvaliacoes(filmeAtualId);
		carregarFilmes();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao deletar avaliação", "erro");
	}
}

async function abrirModalEdicao(filmeId) {
	try {
		const response = await fetch(`/api/filmes/${filmeId}`);
		if (!response.ok) throw new Error("Erro ao carregar filme");

		const filme = await response.json();

		document.getElementById("editFilmeId").value = filme.id;
		document.getElementById("editTitulo").value = filme.titulo;
		document.getElementById("editSinopse").value = filme.sinopse;
		document.getElementById("editPoster").value = filme.poster;

		modalEdicao.style.display = "block";
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao carregar filme", "erro");
	}
}

function fecharModalEdicao() {
	modalEdicao.style.display = "none";
}

formEdicaoFilme.addEventListener("submit", async (e) => {
	e.preventDefault();

	const filmeId = document.getElementById("editFilmeId").value;
	const titulo = document.getElementById("editTitulo").value;
	const sinopse = document.getElementById("editSinopse").value;
	const poster = document.getElementById("editPoster").value;

	try {
		const response = await fetch(`/api/filmes/${filmeId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ titulo, sinopse, poster }),
		});

		if (!response.ok) throw new Error("Erro ao atualizar filme");

		mostrarToast("Filme atualizado com sucesso!", "sucesso");
		fecharModalEdicao();
		carregarFilmes();
		carregarFilmesEditaveis();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao atualizar filme", "erro");
	}
});

document.getElementById("btnDeletarFilme").addEventListener("click", async () => {
	if (!confirm("⚠️ ATENÇÃO: Deletar este filme removerá todas as suas avaliações. Deseja continuar?")) return;

	const filmeId = document.getElementById("editFilmeId").value;

	try {
		const response = await fetch(`/api/filmes/${filmeId}`, {
			method: "DELETE",
		});

		if (!response.ok) throw new Error("Erro ao deletar filme");

		mostrarToast("Filme deletado com sucesso!", "sucesso");
		fecharModalEdicao();
		carregarFilmes();
		carregarFilmesEditaveis();
	} catch (erro) {
		console.error("Erro:", erro);
		mostrarToast("Erro ao deletar filme", "erro");
	}
});

closes.forEach((closeBtn) => {
	closeBtn.addEventListener("click", (e) => {
		const modal = e.target.closest(".modal");
		modal.style.display = "none";
	});
});

window.addEventListener("click", (e) => {
	if (e.target === modalAvaliacao) {
		fecharModalAvaliacao();
	}
	if (e.target === modalEdicao) {
		fecharModalEdicao();
	}
});

navBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		const pagina = btn.getAttribute("data-page");
		mostrarPagina(pagina);
	});
});

document.addEventListener("DOMContentLoaded", () => {
	carregarFilmes();
});
