const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/api/users', async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, name, email, created_at
             FROM users
             ORDER BY id`
        );

        res.json(resultado.rows);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao buscar usuários.'
        });
    }
});

router.post('/api/users', async (req, res) => {
    try {
        const { name, email } = req.body;

        const nomeLimpo = typeof name === 'string' ? name.trim() : '';
        const emailLimpo = typeof email === 'string' ? email.trim() : '';

        if (!nomeLimpo || !emailLimpo) {
            return res.status(400).json({
                erro: 'Nome e e-mail são obrigatórios.'
            });
        }
        const resultado = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [nomeLimpo, emailLimpo]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao cadastrar usuário.'
        });
    }
});

router.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        const nomeLimpo = typeof name === 'string' ? name.trim() : '';
        const emailLimpo = typeof email === 'string' ? email.trim() : '';

        if (!nomeLimpo || !emailLimpo) {
            return res.status(400).json({
                erro: 'Nome e e-mail são obrigatórios.'
            });
        }

        const resultado = await pool.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
            [nomeLimpo, emailLimpo, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao atualizar usuário.'
        });
    }
});

router.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado.'
            });
        }

        res.json({
            mensagem: 'Usuário excluído com sucesso.',
            usuario: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23503') {
            return res.status(409).json({
                erro: 'Não é possível excluir este usuário porque ele está vinculado a tarefas ou projetos.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao excluir usuário.'
        });
    }
});


module.exports = router;