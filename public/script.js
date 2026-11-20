async function carregarProjetos() {
    const resposta = await fetch('/api/projects');

    const projetos = await resposta.json();

    const listaProjetos = document.getElementById('lista-projetos');

    listaProjetos.innerHTML = '';

    projetos.forEach(projeto => {
        const item = document.createElement('div');
        item.classList.add('cartao-projeto');
        item.innerHTML = `
            <h3>${projeto.name}</h3>
            <p>${projeto.description}</p>
        `;

        listaProjetos.appendChild(item);
    });
}

carregarProjetos();

async function carregarTarefas() {
    const resposta = await fetch('/api/tasks');

    const tarefas = await resposta.json();

    const listaTarefas = document.getElementById('lista-tarefas');

    listaTarefas.innerHTML = '';

    tarefas.forEach(tarefa => {
        const item = document.createElement('div');

        item.classList.add('cartao-tarefa');
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
        item.appendChild(titulo);
        item.appendChild(descricao);
        item.appendChild(responsavel);
        item.appendChild(status);
        listaTarefas.appendChild(item);
    });
}

carregarTarefas();

const formularioTarefa = document.getElementById('form-tarefa');

formularioTarefa.addEventListener('submit', async function (event) {
    event.preventDefault();
    const botao = formularioTarefa.querySelector('button');
    botao.disabled = true;
    botao.textContent = 'Cadastrando...';
    const titulo = document.getElementById('titulo').value;
    const descricao = document.getElementById('descricao').value;
    const responsavel = document.getElementById('responsavel').value;
    const projeto = document.getElementById('projeto').value;
    const novaTarefa = {
        title: titulo,
        description: descricao,
        user_id: Number(responsavel),
        project_id: Number(projeto)
    };
    try {
        const resposta = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaTarefa)
        });
        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.erro || 'Erro ao cadastrar tarefa.');
            return;
        }
        alert('Tarefa cadastrada com sucesso!');
        await carregarTarefas();
        formularioTarefa.reset();

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível conectar ao servidor.');
    } finally {
        botao.disabled = false;
        botao.textContent = 'Cadastrar tarefa';
    }

});

async function carregarUsuarios() {
    const resposta = await fetch('/api/users');

    const usuarios = await resposta.json();

    const campoResponsavel = document.getElementById('responsavel');

    usuarios.forEach(usuario => {
        const opcao = document.createElement('option');

        opcao.value = usuario.id;
        opcao.textContent = usuario.name;

        campoResponsavel.appendChild(opcao);
    });
}

carregarUsuarios();

async function carregarProjetosFormulario() {
    const resposta = await fetch('/api/projects');

    const projetos = await resposta.json();

    const campoProjeto = document.getElementById('projeto');

    projetos.forEach(projeto => {
        const opcao = document.createElement('option');

        opcao.value = projeto.id;
        opcao.textContent = projeto.name;

        campoProjeto.appendChild(opcao);
    });
}

carregarProjetosFormulario();