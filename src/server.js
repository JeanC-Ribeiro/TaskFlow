const express = require('express');
const pool = require('./db');
const usersRoutes = require('./routes/users');
const projectsRoutes = require('./routes/projects');
const tasksRoutes = require('./routes/tasks');
const projectMembersRoutes = require('./routes/projectMembers');
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static('public'));
app.use(usersRoutes);
app.use(projectsRoutes);
app.use(tasksRoutes);
app.use(projectMembersRoutes);


app.get('/', (req, res) => {
    res.send('TaskFlow API está funcionando!');
});

app.get('/teste-db', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT NOW()');
        res.send(`Conexão com PostgreSQL funcionando! Horário do banco: ${resultado.rows[0].now}`);
    } catch (erro) {
        console.error(erro);
        res.status(500).send('Erro ao conectar com o PostgreSQL.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

