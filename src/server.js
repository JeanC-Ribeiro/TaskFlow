const express = require('express');
const pool = require('./db');
const usersRoutes = require('./routes/users');
const projectsRoutes = require('./routes/projects');
const tasksRoutes = require('./routes/tasks');
const projectMembersRoutes = require('./routes/projectMembers');
const authRoutes = require('./routes/auth');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use(express.static('public'));
app.use(authRoutes);
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

