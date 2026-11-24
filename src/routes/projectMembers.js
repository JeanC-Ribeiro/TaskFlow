const express = require('express');
const router = express.Router();
const pool = require('../db');


router.post('/api/projects/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;
        const projetoId = Number(id);
        const usuarioId = Number(user_id);
        if (
            !Number.isInteger(projetoId) ||
            projetoId <= 0 ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                erro: 'Informe IDs válidos para o projeto e o usuário.'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO project_members (project_id, user_id)
             VALUES ($1, $2)
             RETURNING *`,
            [projetoId, usuarioId]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Este usuário já participa do projeto.'
            });
        }

        if (erro.code === '23503') {
            return res.status(404).json({
                erro: 'Projeto ou usuário não encontrado.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao adicionar membro ao projeto.'
        });
    }
});

router.get('/api/projects/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const projetoId = Number(id);

        if (!Number.isInteger(projetoId) || projetoId <= 0) {
            return res.status(400).json({
                erro: 'ID do projeto inválido.'
            });
        }
        const resultado = await pool.query(
            `SELECT
                users.id,
                users.name,
                users.email,
                project_members.joined_at
             FROM project_members
             INNER JOIN users
                ON project_members.user_id = users.id
             WHERE project_members.project_id = $1
             ORDER BY users.name`,
            [projetoId]
        );

        res.json(resultado.rows);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao buscar membros do projeto.'
        });
    }
});

router.delete('/api/projects/:id/members/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        const projetoId = Number(id);
        const usuarioId = Number(userId);

        if (
            !Number.isInteger(projetoId) ||
            projetoId <= 0 ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(400).json({
                erro: 'IDs do projeto e do usuário inválidos.'
            });
        }

        const resultado = await pool.query(
            `DELETE FROM project_members
             WHERE project_id = $1 AND user_id = $2
             RETURNING *`,
            [projetoId, usuarioId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Membro não encontrado neste projeto.'
            });
        }

        res.json({
            mensagem: 'Membro removido do projeto com sucesso.',
            membro: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao remover membro do projeto.'
        });
    }
});

module.exports = router;