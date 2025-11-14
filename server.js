const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const dbRoutes = require("./routes/dbRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api", dbRoutes);

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
	res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, () => {
	console.log(`\nServidor: http://localhost:${PORT}\n`);
	console.log(`Frontend: http://localhost:${PORT}`);
	console.log(`API: http://localhost:${PORT}/api/filmes\n`);
});
