
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const nomeLimpo = typeof name === 'string' ? name.trim() : '';
        const emailLimpo = typeof email === 'string'
            ? email.trim().toLowerCase()
            : '';

        if (nomeLimpo === '') {
            return res.status(400).json({
                erro: 'Informe um nome válido.'
            });
        }

        if (emailLimpo === '') {
            return res.status(400).json({
                erro: 'Informe um e-mail válido.'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
            return res.status(400).json({
                erro: 'Informe um e-mail válido.'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                erro: 'A senha deve possuir pelo menos 8 caracteres.'
            });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                erro: 'A senha excede o limite permitido.'
            });
        }

        if (nomeLimpo.length > 100 || emailLimpo.length > 150) {
            return res.status(400).json({
                erro: 'Nome ou e-mail excede o tamanho permitido.'
            });
        }

        const senhaHash = await bcrypt.hash(password, 10);

        const resultado = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role, created_at`,
            [nomeLimpo, emailLimpo, senhaHash]
        );

        res.status(201).json({
            mensagem: 'Conta cadastrada com sucesso!',
            usuario: resultado.rows[0]
        });

    } catch (erro) {
        if (erro.code === '23505') {
            return res.status(409).json({
                erro: 'Este e-mail já está cadastrado.'
            });
        }

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar conta.'
        });
    }
});
router.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const emailLimpo = typeof email === 'string'
            ? email.trim().toLowerCase()
            : '';

        if (emailLimpo === '' || typeof password !== 'string') {
            return res.status(400).json({
                erro: 'Informe o e-mail e a senha.'
            });
        }

        const resultado = await pool.query(
            `SELECT id, name, email, password_hash, role
             FROM users
             WHERE email = $1`,
            [emailLimpo]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        const usuario = resultado.rows[0];

        if (!usuario.password_hash) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            password,
            usuario.password_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: 'E-mail ou senha incorretos.'
            });
        }

        req.session.regenerate((erroSessao) => {
            console.log('Etapa 1: regenerate executado');
            if (erroSessao) {
                console.error(erroSessao);
                return res.status(500).json({
                    erro: 'Erro ao iniciar a sessão.'
                });
            }

            req.session.userId = usuario.id;
            console.log('Etapa 2: userId definido');
            req.session.save((erroSalvar) => {
                console.log('Etapa 3: callback do save executado');
                if (erroSalvar) {
                    console.error(erroSalvar);
                    return res.status(500).json({
                        erro: 'Erro ao salvar a sessão.'
                    });
                }

                res.status(200).json({
                    mensagem: 'Login realizado com sucesso!',
                    usuario: {
                        id: usuario.id,
                        name: usuario.name,
                        email: usuario.email,
                        role: usuario.role
                    }
                });
            });
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao realizar login.'
        });
    }
});

router.get('/api/auth/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                erro: 'Usuário não autenticado.'
            });
        }

        const resultado = await pool.query(
            `SELECT id, name, email, role
             FROM users
             WHERE id = $1`,
            [req.session.userId]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                erro: 'Usuário não encontrado.'
            });
        }

        res.status(200).json({
            usuario: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao consultar usuário autenticado.'
        });
    }
});

module.exports = router;
