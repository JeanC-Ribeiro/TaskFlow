const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/api/tasks', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                tasks.id,
                tasks.user_id,
                tasks.project_id,
                tasks.created_at,
                tasks.title,
                tasks.description,
                tasks.status,
                users.name AS responsavel,
                projects.name AS projeto                
            FROM tasks
            INNER JOIN users
                ON tasks.user_id = users.id
            INNER JOIN projects
                ON tasks.project_id = projects.id
            ORDER BY tasks.id
        `);

        res.json(resultado.rows);

    } catch (erro) {
        console.error(erro);
        res.status(500).json({
            erro: 'Erro ao buscar tarefas.'
        });
    }
});


router.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, user_id, project_id, status } = req.body;
        const tituloLimpo = typeof title === 'string' ? title.trim() : '';
        const usuarioId = Number(user_id);
        const projetoId = Number(project_id);
        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({
                erro: 'A descrição deve ser um texto válido.'
            });
        }
        const statusPermitidos = ['Pendente', 'Em andamento', 'Concluída'];

        if (
            !tituloLimpo ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0 ||
            !Number.isInteger(projetoId) ||
            projetoId <= 0
        ) {
            return res.status(400).json({
                erro: 'Informe um título, responsável e projeto válidos.'
            });
        }
        if (tituloLimpo.length > 150) {
            return res.status(400).json({
                erro: 'O título deve ter no máximo 150 caracteres.'
            });
        }
        if (status && !statusPermitidos.includes(status)) {
            return res.status(400).json({
                erro: 'Status inválido. Utilize: Pendente, Em andamento ou Concluída.'
            });
        }
        const resultado = await pool.query(
            `INSERT INTO tasks (title, description, user_id, project_id, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [tituloLimpo, description, usuarioId, projetoId, status || 'Pendente']);

        res.status(201).json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23503') {
            return res.status(409).json({
                erro: 'O responsável não participa deste projeto ou o projeto não existe.'
            });
        }

        res.status(500).json({
            erro: 'Erro ao cadastrar tarefa.'
        });
    }
});


router.put('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, user_id, project_id } = req.body;
        const tarefaId = Number(id);
        if (!Number.isInteger(tarefaId) || tarefaId <= 0) {
            return res.status(400).json({
                erro: 'ID da tarefa inválido.'
            });
        }
        const tituloLimpo = typeof title === 'string' ? title.trim() : '';
        const usuarioId = Number(user_id);
        const projetoId = Number(project_id);
        if (description !== undefined && typeof description !== 'string') {
            return res.status(400).json({
                erro: 'A descrição deve ser um texto válido.'
            });
        }

        if (
            !tituloLimpo ||
            !status ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0 ||
            !Number.isInteger(projetoId) ||
            projetoId <= 0
        ) {
            return res.status(400).json({
                erro: 'Título, status, responsável e projeto devem ser válidos.'
            });
        }
        if (tituloLimpo.length > 150) {
            return res.status(400).json({
                erro: 'O título deve ter no máximo 150 caracteres.'
            });
        }
        const statusPermitidos = ['Pendente', 'Em andamento', 'Concluída'];
        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                erro: 'Status inválido. Utilize: Pendente, Em andamento ou Concluída.'
            });
        }
        const resultado = await pool.query(
            `UPDATE tasks
             SET title = $1,
                 description = $2,
                 status = $3,
                 user_id = $4,
                 project_id = $5
             WHERE id = $6
             RETURNING *`,
            [tituloLimpo, description, status, usuarioId, projetoId, tarefaId]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Tarefa não encontrada.'
            });
        }

        res.json(resultado.rows[0]);

    } catch (erro) {
        console.error(erro);
        if (erro.code === '23503') {
            return res.status(409).json({
                erro: 'O responsável não participa deste projeto ou o projeto não existe.'
            });
        }
        res.status(500).json({
            erro: 'Erro ao atualizar tarefa.'
        });
    }
});

router.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarefaId = Number(id);
        if (!Number.isInteger(tarefaId) || tarefaId <= 0) {
            return res.status(400).json({
                erro: 'ID da tarefa inválido.'
            });
        }

        const resultado = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [tarefaId]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Tarefa não encontrada.'
            });
        }

        res.json({
            mensagem: 'Tarefa excluída com sucesso.',
            tarefa: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao excluir tarefa.'
        });
    }
});


module.exports = router;