const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/api/projects', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, name, description, created_at
            FROM projects
            ORDER BY id
        `);

        res.json(resultado.rows);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar projetos.'
        });
    }
});

router.post('/api/projects', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                erro: 'O nome do projeto é obrigatório.'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO projects (name, description)
             VALUES ($1, $2)
             RETURNING *`,
            [name, description]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar projeto.'
        });
    }
});

router.put('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                erro: 'O nome do projeto é obrigatório.'
            });
        }

        const resultado = await pool.query(
            `UPDATE projects
             SET name = $1, description = $2
             WHERE id = $3
             RETURNING *`,
            [name, description, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Projeto não encontrado.'
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar projeto.'
        });
    }
});

router.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(
            'DELETE FROM projects WHERE id = $1 RETURNING *',
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Projeto não encontrado.'
            });
        }

        res.json({
            mensagem: 'Projeto excluído com sucesso.',
            projeto: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao excluir projeto.'
        });
    }
});


module.exports = router;