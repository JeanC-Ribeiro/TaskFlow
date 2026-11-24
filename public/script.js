async function carregarProjetos() {
    try {
        const resposta = await fetch('/api/projects');

        if (!resposta.ok) {
            throw new Error('Erro ao buscar projetos.');
        }

        const projetos = await resposta.json();

        const listaProjetos = document.getElementById('lista-projetos');

        listaProjetos.innerHTML = '';


        projetos.forEach(projeto => {
            const item = document.createElement('div');
            item.classList.add('cartao-projeto');

            const nome = document.createElement('h3');
            nome.textContent = projeto.name;

            const descricao = document.createElement('p');
            descricao.textContent = projeto.description || 'Sem descrição';

            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';
            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir';

            botaoEditar.addEventListener('click', () => {
                projetoEmEdicao = projeto;
                campoNomeProjeto.value = projeto.name;
                campoDescricaoProjeto.value = projeto.description || '';
                formularioProjeto.querySelector('button').textContent = 'Salvar alterações';

                botaoCancelarProjeto.hidden = false;

                formularioProjeto.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            botaoExcluir.addEventListener('click', async () => {
                if (projetoEmEdicao && projetoEmEdicao.id === projeto.id) {
                    alert('Este projeto está sendo editado. Cancele a edição antes de excluí-lo.');
                    return;
                }
                const confirmar = confirm(
                    `Tem certeza que deseja excluir o projeto "${projeto.name}"?`
                );

                if (!confirmar) {
                    return;
                }

                try {
                    const resposta = await fetch(`/api/projects/${projeto.id}`, {
                        method: 'DELETE'
                    });

                    const resultado = await resposta.json();
                    if (!resposta.ok) {
                        alert(resultado.erro || 'Erro ao excluir projeto.');
                        return;
                    }

                    alert('Projeto excluído com sucesso!');

                    await carregarProjetos();
                    await carregarProjetosFormulario();

                } catch (erro) {
                    console.error(erro);
                    alert('Não foi possível conectar ao servidor.');
                }
            });

            item.appendChild(nome);
            item.appendChild(descricao);
            item.appendChild(botaoEditar);
            item.appendChild(botaoExcluir);

            listaProjetos.appendChild(item);
        });

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível carregar os projetos. Verifique sua conexão com o servidor.');
    }
}


carregarProjetos();

async function carregarTarefas() {
    try {
        const resposta = await fetch('/api/tasks');
        if (!resposta.ok) {
            throw new Error('Erro ao buscar tarefas.');
        }
        const tarefas = await resposta.json();
        const projetoSelecionado = filtroProjeto.value;
        const respostaProjetos = await fetch('/api/projects');
        if (!respostaProjetos.ok) {
            throw new Error('Erro ao buscar projetos.');
        }
        const projetos = await respostaProjetos.json();

        filtroProjeto.innerHTML = '<option value="">Todos os projetos</option>';
        projetos.forEach(projeto => {
            const opcao = document.createElement('option');

            opcao.value = projeto.id;
            opcao.textContent = projeto.name;

            filtroProjeto.appendChild(opcao);
        });

        filtroProjeto.value = projetoSelecionado;
        const filtroResponsavel = document.getElementById('filtro-responsavel');
        const responsavelSelecionado = filtroResponsavel.value;
        filtroResponsavel.innerHTML = '<option value="">Todos os responsáveis</option>';
        const responsaveis = new Map();
        tarefas.forEach(tarefa => {
            responsaveis.set(tarefa.user_id, tarefa.responsavel);
        });

        responsaveis.forEach((nome, id) => {
            const opcao = document.createElement('option');

            opcao.value = id;
            opcao.textContent = nome;

            filtroResponsavel.appendChild(opcao);
        });

        filtroResponsavel.value = responsavelSelecionado;
        const pendentes = tarefas.filter(tarefa => tarefa.status === 'Pendente').length;
        const emAndamento = tarefas.filter(tarefa => tarefa.status === 'Em andamento').length;
        const concluidas = tarefas.filter(tarefa => tarefa.status === 'Concluída').length;

        document.getElementById('total-pendentes').textContent = pendentes;
        document.getElementById('total-andamento').textContent = emAndamento;
        document.getElementById('total-concluidas').textContent = concluidas;
        const listaTarefas = document.getElementById('lista-tarefas');
        listaTarefas.innerHTML = '';

        tarefas.forEach(tarefa => {
            const item = document.createElement('div');
            item.classList.add('cartao-tarefa');
            item.dataset.responsavelId = tarefa.user_id;
            item.dataset.projetoId = tarefa.project_id;

            const cabecalho = document.createElement('div');
            cabecalho.classList.add('cabecalho-tarefa');

            const titulo = document.createElement('h3');
            titulo.textContent = tarefa.title;

            const descricao = document.createElement('p');
            descricao.textContent = tarefa.description || 'Sem descrição';

            const responsavel = document.createElement('p');
            responsavel.textContent = `Responsável: ${tarefa.responsavel}`;

            const status = document.createElement('span');
            status.classList.add('status-tarefa');

            if (tarefa.status === 'Pendente') {
                status.classList.add('pendente');
            } else if (tarefa.status === 'Em andamento') {
                status.classList.add('em-andamento');
            } else if (tarefa.status === 'Concluída') {
                status.classList.add('concluida');
            }

            status.textContent = tarefa.status;
            const seletorStatus = document.createElement('select');

            const statusDisponiveis = [
                'Pendente',
                'Em andamento',
                'Concluída'
            ];

            statusDisponiveis.forEach(opcao => {
                const option = document.createElement('option');

                option.value = opcao;
                option.textContent = opcao;

                seletorStatus.appendChild(option);
            });

            seletorStatus.value = tarefa.status;
            cabecalho.appendChild(titulo);
            cabecalho.appendChild(status);
            const areaStatus = document.createElement('div');
            areaStatus.classList.add('area-status');

            const legendaStatus = document.createElement('label');
            legendaStatus.textContent = 'Alterar status:';

            areaStatus.appendChild(legendaStatus);
            areaStatus.appendChild(seletorStatus);

            item.appendChild(cabecalho);
            item.appendChild(descricao);
            item.appendChild(responsavel);
            item.appendChild(areaStatus);
            seletorStatus.addEventListener('change', async function () {
                seletorStatus.disabled = true;
                try {
                    const resposta = await fetch(`/api/tasks/${tarefa.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            title: tarefa.title,
                            description: tarefa.description,
                            status: seletorStatus.value,
                            user_id: tarefa.user_id,
                            project_id: tarefa.project_id
                        })
                    });

                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        alert(resultado.erro || 'Erro ao atualizar status.');
                        return;
                    }

                    alert('Status atualizado com sucesso!');

                    await carregarTarefas();

                } catch (erro) {
                    console.error(erro);
                    alert('Não foi possível conectar ao servidor.');
                } finally {
                    seletorStatus.disabled = false;
                }
            });
            listaTarefas.appendChild(item);

            const botaoEditar = document.createElement('button');

            botaoEditar.textContent = 'Editar';
            botaoEditar.addEventListener('click', function () {
                tarefaEmEdicao = tarefa;
                botaoCancelar.hidden = false;

                document.getElementById('titulo').value = tarefa.title;
                document.getElementById('descricao').value = tarefa.description || '';
                document.getElementById('responsavel').value = tarefa.user_id;
                document.getElementById('projeto').value = tarefa.project_id;

                formularioTarefa.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
            const acoes = document.createElement('div');
            acoes.classList.add('acoes-tarefa');
            acoes.appendChild(botaoEditar);
            const botaoExcluir = document.createElement('button');

            botaoExcluir.textContent = 'Excluir';

            acoes.appendChild(botaoExcluir);
            item.appendChild(acoes);
            botaoExcluir.addEventListener('click', async function () {
                const confirmar = confirm('Tem certeza que deseja excluir esta tarefa?');

                if (!confirmar) {
                    return;
                }
                botaoExcluir.disabled = true;
                botaoExcluir.textContent = 'Excluindo...';

                try {
                    const resposta = await fetch(`/api/tasks/${tarefa.id}`, {
                        method: 'DELETE'
                    });

                    const resultado = await resposta.json();

                    if (!resposta.ok) {
                        alert(resultado.erro || 'Erro ao excluir tarefa.');
                        return;
                    }

                    alert('Tarefa excluída com sucesso!');

                    await carregarTarefas();

                } catch (erro) {
                    console.error(erro);
                    alert('Não foi possível conectar ao servidor.');
                } finally {
                    botaoExcluir.disabled = false;
                    botaoExcluir.textContent = 'Excluir';
                }
            });
        });

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível carregar as tarefas. Verifique sua conexão com o servidor.');
    }
}

const campoPesquisa = document.getElementById('pesquisa-titulo');
const filtroStatus = document.getElementById('filtro-status');
const filtroResponsavel = document.getElementById('filtro-responsavel');
const filtroProjeto = document.getElementById('filtro-projeto');
const botaoLimparFiltros = document.getElementById('limpar-filtros');
const formularioProjeto = document.getElementById('form-projeto');
const campoNomeProjeto = document.getElementById('nome-projeto');
const campoDescricaoProjeto = document.getElementById('descricao-projeto');
let projetoEmEdicao = null;
const botaoCancelarProjeto = document.getElementById('botao-cancelar-projeto');

botaoCancelarProjeto.addEventListener('click', () => {
    projetoEmEdicao = null;

    formularioProjeto.reset();

    formularioProjeto.querySelector('button[type="submit"]').textContent = 'Cadastrar projeto';

    botaoCancelarProjeto.hidden = true;
});

formularioProjeto.addEventListener('submit', async (event) => {
    event.preventDefault();

    console.log('Cadastro de projeto iniciado!');

    const nome = campoNomeProjeto.value.trim();
    const descricao = campoDescricaoProjeto.value.trim();

    if (nome === '') {
        alert('Informe um nome válido para o projeto.');
        return;
    }

    const botao = formularioProjeto.querySelector('button');

    botao.disabled = true;
    botao.textContent = projetoEmEdicao
        ? 'Salvando...'
        : 'Cadastrando...';

    try {
        const url = projetoEmEdicao
            ? `/api/projects/${projetoEmEdicao.id}`
            : '/api/projects';

        const metodo = projetoEmEdicao ? 'PUT' : 'POST';

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: nome,
                description: descricao
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.erro || 'Erro ao cadastrar projeto.');
            return;
        }

        const mensagem = projetoEmEdicao
            ? 'Projeto atualizado com sucesso!'
            : 'Projeto cadastrado com sucesso!';

        alert(mensagem);

        projetoEmEdicao = null;
        botaoCancelarProjeto.hidden = true;
        formularioProjeto.reset();

        await carregarProjetos();
        await carregarProjetosFormulario();

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível conectar ao servidor.');

    } finally {
        botao.disabled = false;
        botao.textContent = projetoEmEdicao
            ? 'Salvar alterações'
            : 'Cadastrar projeto';
    }
});


function aplicarFiltros() {
    const termoPesquisa = campoPesquisa.value.toLowerCase();
    const statusSelecionado = filtroStatus.value;
    const responsavelSelecionado = filtroResponsavel.value;
    const projetoSelecionado = filtroProjeto.value;

    const listaTarefas = document.getElementById('lista-tarefas');

    const cartoes = listaTarefas.querySelectorAll('.cartao-tarefa');

    cartoes.forEach(cartao => {
        const titulo = cartao.querySelector('h3').textContent.toLowerCase();

        const status = cartao.querySelector('.status-tarefa').value;
        const responsavelId = cartao.dataset.responsavelId;
        const projetoId = cartao.dataset.projetoId;

        const correspondeTitulo = titulo.includes(termoPesquisa);

        const correspondeStatus =
            statusSelecionado === '' || status === statusSelecionado;

        const correspondeResponsavel =
            responsavelSelecionado === '' ||
            responsavelId === responsavelSelecionado;

        const correspondeProjeto =
            projetoSelecionado === '' ||
            projetoId === projetoSelecionado;

        if (
            correspondeTitulo &&
            correspondeStatus &&
            correspondeResponsavel &&
            correspondeProjeto
        ) {
            cartao.style.display = 'flex';
        } else {
            cartao.style.display = 'none';
        }
    });
}

campoPesquisa.addEventListener('input', aplicarFiltros);
filtroStatus.addEventListener('change', aplicarFiltros);
filtroResponsavel.addEventListener('change', aplicarFiltros);
filtroProjeto.addEventListener('change', aplicarFiltros);
botaoLimparFiltros.addEventListener('click', () => {
    campoPesquisa.value = '';
    filtroStatus.value = '';
    filtroResponsavel.value = '';
    filtroProjeto.value = '';

    aplicarFiltros();
});

carregarTarefas();

const formularioTarefa = document.getElementById('form-tarefa');
let tarefaEmEdicao = null;
const botaoCancelar = document.getElementById('botao-cancelar');
let usuarioEmEdicao = null;
const formularioUsuario = document.getElementById('form-usuario');
const botaoSalvarUsuario = document.getElementById('botao-salvar-usuario');
const botaoCancelarUsuario = document.getElementById('botao-cancelar-usuario');

botaoCancelarUsuario.addEventListener('click', () => {
    usuarioEmEdicao = null;

    formularioUsuario.reset();

    botaoSalvarUsuario.textContent = 'Cadastrar usuário';

    botaoCancelarUsuario.hidden = true;
});

formularioUsuario.addEventListener('submit', async (event) => {
    event.preventDefault();
    const estavaEditando = Boolean(usuarioEmEdicao);
    const botao = botaoSalvarUsuario;


    const nome = document.getElementById('nome-usuario').value;
    const email = document.getElementById('email-usuario').value;
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (nomeLimpo === '') {
        alert('Informe um nome válido.');
        return;
    }

    if (emailLimpo === '') {
        alert('Informe um e-mail válido.');
        return;
    }

    botao.disabled = true;
    botao.textContent = estavaEditando
        ? 'Salvando...'
        : 'Cadastrando...';

    try {
        const url = usuarioEmEdicao
            ? `/api/users/${usuarioEmEdicao.id}`
            : '/api/users';

        const metodo = usuarioEmEdicao ? 'PUT' : 'POST';

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: nomeLimpo,
                email: emailLimpo
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.erro || 'Erro ao salvar usuário.');
            return;
        }

        alert(
            usuarioEmEdicao
                ? 'Usuário atualizado com sucesso!'
                : 'Usuário cadastrado com sucesso!'
        );

        usuarioEmEdicao = null;
        formularioUsuario.reset();
        botaoSalvarUsuario.textContent = 'Cadastrar usuário';
        botaoCancelarUsuario.hidden = true;

        await carregarListaUsuarios();
        await carregarUsuarios();

    } catch (erro) {
        console.error('Erro:', erro);
        alert('Não foi possível conectar ao servidor.');
    } finally {
        botao.disabled = false;
        botao.textContent = usuarioEmEdicao
            ? 'Salvar alterações'
            : 'Cadastrar usuário';
    }

});

botaoCancelar.addEventListener('click', function () {
    tarefaEmEdicao = null;

    formularioTarefa.reset();

    document.querySelector('.nova-tarefa h2').textContent = 'Nova tarefa';

    formularioTarefa.querySelector('button[type="submit"]').textContent = 'Cadastrar tarefa';

    botaoCancelar.hidden = true;
});

async function carregarListaUsuarios() {
    try {
        const resposta = await fetch('/api/users');
        if (!resposta.ok) {
            throw new Error('Erro ao buscar usuários.');
        }
        const usuarios = await resposta.json();
        const listaUsuarios = document.getElementById('lista-usuarios');

        listaUsuarios.innerHTML = '';

        usuarios.forEach(usuario => {
            const item = document.createElement('div');
            item.classList.add('cartao-usuario');

            const nome = document.createElement('h3');
            nome.textContent = usuario.name;

            const email = document.createElement('p');
            email.textContent = usuario.email;

            const botaoEditar = document.createElement('button');
            botaoEditar.textContent = 'Editar';

            botaoEditar.addEventListener('click', () => {
                usuarioEmEdicao = usuario;

                document.getElementById('nome-usuario').value = usuario.name;
                document.getElementById('email-usuario').value = usuario.email;
                botaoSalvarUsuario.textContent = 'Salvar alterações';
                botaoCancelarUsuario.hidden = false;

                console.log('Usuário selecionado para edição:', usuario);
            });

            const botaoExcluir = document.createElement('button');
            botaoExcluir.textContent = 'Excluir';

            botaoExcluir.addEventListener('click', async () => {
                const confirmar = confirm(
                    `Deseja excluir o usuário ${usuario.name}?`
                );

                if (!confirmar) {
                    return;
                }

                botaoExcluir.disabled = true;
                botaoExcluir.textContent = 'Excluindo...';

                try {
                    const resposta = await fetch(`/api/users/${usuario.id}`, {
                        method: 'DELETE'
                    });
                    const resultado = await resposta.json();
                    if (!resposta.ok) {
                        alert(resultado.erro || 'Erro ao excluir usuário.');
                        return;
                    }

                    alert('Usuário excluído com sucesso!');

                    carregarListaUsuarios();
                    carregarUsuarios();

                } catch (erro) {
                    console.error('Erro:', erro);
                    alert('Não foi possível conectar ao servidor.');
                }
                finally {
                    botaoExcluir.disabled = false;
                    botaoExcluir.textContent = 'Excluir';
                }
            });

            const informacoes = document.createElement('div');

            informacoes.classList.add('informacoes-usuario');

            informacoes.appendChild(nome);
            informacoes.appendChild(email);

            const acoes = document.createElement('div');

            acoes.classList.add('acoes-usuario');

            acoes.appendChild(botaoEditar);
            acoes.appendChild(botaoExcluir);

            item.appendChild(informacoes);
            item.appendChild(acoes);

            listaUsuarios.appendChild(item);
        });

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível carregar os usuários. Verifique sua conexão com o servidor.');
    }
}


carregarListaUsuarios();
formularioTarefa.addEventListener('submit', async function (event) {
    event.preventDefault();
    const estavaEditando = Boolean(tarefaEmEdicao);
    const botao = formularioTarefa.querySelector('button');
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value;
    const responsavel = document.getElementById('responsavel').value;
    const projeto = document.getElementById('projeto').value;

    if (titulo === '') {
        alert('Informe um título válido para a tarefa.');
        return;
    }

    if (!responsavel) {
        alert('Selecione um responsável.');
        return;
    }

    if (!projeto) {
        alert('Selecione um projeto.');
        return;
    }

    botao.disabled = true;
    botao.textContent = estavaEditando
        ? 'Salvando...'
        : 'Cadastrando...';

    const novaTarefa = {
        title: titulo,
        description: descricao,
        user_id: Number(responsavel),
        project_id: Number(projeto),
        status: tarefaEmEdicao
            ? tarefaEmEdicao.status
            : 'Pendente'
    };
    try {
        const url = tarefaEmEdicao
            ? `/api/tasks/${tarefaEmEdicao.id}`
            : '/api/tasks';

        const metodo = tarefaEmEdicao ? 'PUT' : 'POST';

        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaTarefa)
        });
        if (!resposta.ok) {
            const resultado = await resposta.json();

            alert(resultado.erro || (
                estavaEditando
                    ? 'Erro ao atualizar tarefa.'
                    : 'Erro ao cadastrar tarefa.'
            ));

            return;
        }

        const resultado = await resposta.json();
        const mensagem = tarefaEmEdicao
            ? 'Tarefa atualizada com sucesso!'
            : 'Tarefa cadastrada com sucesso!';

        alert(mensagem);

        tarefaEmEdicao = null;
        formularioTarefa.reset();
        botaoCancelar.hidden = true;

        document.querySelector('.nova-tarefa h2').textContent = 'Nova tarefa';

        await carregarTarefas();

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível conectar ao servidor.');
    } finally {
        botao.disabled = false;
        botao.textContent = tarefaEmEdicao
            ? 'Salvar alterações'
            : 'Cadastrar tarefa';
    }

});

async function carregarUsuarios() {
    try {
        const resposta = await fetch('/api/users');

        if (!resposta.ok) {
            throw new Error('Erro ao buscar usuários.');
        }

        const usuarios = await resposta.json();

        const campoResponsavel = document.getElementById('responsavel');

        campoResponsavel.innerHTML = '<option value="">Selecione um responsável</option>';

        usuarios.forEach(usuario => {
            const opcao = document.createElement('option');

            opcao.value = usuario.id;
            opcao.textContent = usuario.name;

            campoResponsavel.appendChild(opcao);
        });

    } catch (erro) {
        console.error('Erro ao carregar usuários:', erro);
        alert('Não foi possível carregar os responsáveis.');
    }
}

carregarUsuarios();

async function carregarProjetosFormulario() {
    try {
        const resposta = await fetch('/api/projects');

        if (!resposta.ok) {
            throw new Error('Erro ao buscar projetos.');
        }

        const projetos = await resposta.json();

        const campoProjeto = document.getElementById('projeto');

        campoProjeto.innerHTML = '<option value="">Selecione um projeto</option>';

        projetos.forEach(projeto => {
            const opcao = document.createElement('option');

            opcao.value = projeto.id;
            opcao.textContent = projeto.name;

            campoProjeto.appendChild(opcao);
        });

    } catch (erro) {
        console.error('Erro ao carregar projetos:', erro);
        alert('Não foi possível carregar os projetos.');
    }
}


carregarProjetosFormulario();