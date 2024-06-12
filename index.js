//Importação das bibliotecas necessárias
const express = require('express');
const exphbs = require('express-handlebars');
const mysql2 = require('mysql2');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const moment = require('moment');

// Inicialização do servidor Express
const app = express(); // Cria uma instância do aplicativo Express

// Middleware para permitir JSON no corpo das requisições
app.use(express.json());
// Middleware para servir arquivos estáticos da pasta 'assets'
app.use(express.static('assets'));
// Middleware para servir arquivos estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Middleware para habilitar CORS (permite que a aplicação web seja acessível a partir de diferentes domínios)
app.use(cors());

// Middleware para permitir dados codificados em URL no corpo das requisições
app.use(
    express.urlencoded({
        extended: true
    })
);

// Configuração do middleware de sessão para usuários
app.use(session({
    secret: 'S%G@m#19!25^23', // Chave secreta para assinar o ID da sessão
    resave: true, // Salva a sessão mesmo que não haja modificações
    saveUninitialized: false, // Não salva novas sessões sem modificações
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 //Tempo de expiração do cookie em milissegundos
    }
}));

// Define o armazenamento em memória para os arquivos
const storage = multer.memoryStorage();
// Configura o multer para usar o armazenamento em memória
const upload = multer({ storage: storage });

// Configuração do Express Handlebars como motor de templates
const hbs = exphbs.create({
    defaultLayout: 'main', // Layout padrão
    helpers: {
        formatDate: function (date) {
            return moment(date).format('DD-MM-YYYY HH:mm:ss'); // Helper para formatar datas
        }
    }
});
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars'); // Define a extensão de template padrão como '.handlebars'

// Middleware de autenticação para verificar se o usuário está logado
function checkAuth(message) {
    return function (req, res, next) {
        if (!req.session.user) { // Verifica se a sessão do usuário existe
            req.session.message = message; // Armazena a mensagem na sessão
            return res.redirect('/showMessage'); // Redireciona para a rota de exibição de mensagem
        }
        next(); // Continua para o próximo middleware
    }
};

// Middleware para verificar a propriedade do post
function checkOwnership(message) {
    return function (req, res, next) {
        const postId = req.body.id || req.params.id; // Obtém o ID do post
        const userId = req.session.user.id; // Obtém o ID do usuário da sessão

        // Consulta SQL para verificar a propriedade
        const sql = `SELECT * FROM Correios WHERE id = ${postId} AND user_id = ${userId}`;

        // Executando a consulta SQL
        conn.query(sql, function (err, data) {
            if (err) {
                console.log('erro: ', err)
                return
            }

            if (data.length === 0) { // Verifica se o post pertence ao usuário
                req.session.message = message;
                return res.redirect('/showMessage');
            }

            next();
        })
    }
};

// Rota Inicial (Login)
app.get('/', (req, res) => {
    res.render('login', { css: '/style/login.css', title: '| Login' })
});

// Rota para autenticação de login
app.post('/login', (req, res) => {
    const { username, password } = req.body; // Obtém o nome de usuário e a senha do corpo da requisição
    const sql = `SELECT * FROM Users WHERE username = '${username}'`; // Consulta SQL para buscar o usuário

    conn.query(sql, [username], (err, results) => {
        if (err) {
            console.log('erro: ', err);
            return false;
        }

        if (results.length === 0) { // Verifica se o usuário não foi encontrado
            return res.status(400).render('login', { css: '/style/login.css', message: 'Usuário não encontrado!' })
        }

        const user = results[0]; // Obtém o primeiro resultado (usuário encontrado

        if (user.password_ !== password) { // Verifica se a senha está incorreta

            return res.status(400).render('login', { css: '/style/login.css', message: 'Senha Incorreta!' })
        }

        console.log('Usuário autenticado:', user)

        req.session.user = { id: user.id, username: user.username }; // Armazena os dados do usuário na sessão
        console.log('Sessão do usuário:', req.session.user)
        res.redirect('/home');
    })
});

// Rota para a página de cadastro
app.get('/signUp', (req, res) => {
    res.render('signUp', { css: '/style/login.css', title: '| Cadastre-se' })
});

// Rota para a criação de um novo usuário
app.post('/upSign', (req, res) => {
    const { username, name, email, password } = req.body; // Obtém os dados do corpo da requisição

    const checkUsername = `SELECT * FROM Users WHERE username = '${username}'`; // Consulta SQL para verificar se o username já existe

    conn.query(checkUsername, [username], (err, data) => {
        if (err) {
            console.log('erro: ', err);
            return false;
        }

        if (data.length > 0) { // Verifica se o username já existe

            return res.status(400).render('signUp', { css: '/style/login.css', message: 'Username já existe! Faça login ou escolha outro.' })
        }

        const sql = `INSERT INTO Users (username, name_, email, password_) 
        VALUES ('${username}', '${name}', '${email}', '${password}')`; // Consulta SQL para inserir um novo usuário

        conn.query(sql, function (err, data) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            const newUser = data.insertId; //Obtém o ID do novo usuário

            req.session.user = { id: newUser, username: username }; // Armazena os dados do novo usuário na sessão
            console.log('User registrado e autenticado: ', req.session.user);

            res.redirect('/home');
        })
    })
});

// Rota para a página principal (home)
app.get('/home', (req, res) => {

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id
    ORDER BY Correios.created_at DESC`; // Consulta SQL para buscar os posts

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err)
            return
        }

        // Renderiza a página principal com os dados dos posts
        res.render('index', { css: '/style/home.css', title: '', user: req.session.user, correios: data });
    })
});

// Rota para filtrar correios por categoria
app.get('/home/category/:category', (req, res) => {
    const category = req.params.category; // Obtém a categoria da URL

    console.log(category)

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE category = '${category}'`; // Consulta SQL para buscar os posts por categoria

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err)
            return
        }

        res.render('index', { css: '/style/home.css', title: '', user: req.session.user, correios: data, category });
    })
});

// Rota para a página de criação de novo correio
app.get('/create', checkAuth('Você precisa estar logado para criar um post!'), (req, res) => {

    res.render('createCorreio', { css: '/style/newCorreio.css', title: '' });

});

// Rota para exibir mensagens ao usuário
app.get('/showMessage', (req, res) => {
    res.render('showMessage', { css: '/style/message.css', message: req.session.message });
});

// Rota para upload de novo correio
app.post('/upload', upload.single('image'), async (req, res) => {
    try {

        const id = req.session.user.id; // Obtém o ID do usuário da sessão
        const title = req.body.title; // Obtém o título do corpo da requisição
        const category = req.body.category; // Obtém a categoria do corpo da requisição
        const post = req.body.post; // Obtém o post do corpo da requisição

        let imgName = null;
        if (req.file) { // Verifica se há um arquivo de imagem
            const imgData = req.file.buffer; // Obtém os dados da imagem
            imgName = req.file.originalname; // Obtém o nome original da imagem
            await sharp(imgData).toFile(`uploads/${imgName}`); // Salva a imagem no diretório 'uploads'
        }

        const sql = `INSERT INTO Correios (title, category, post, imageName, user_id)
        VALUES ('${title}', '${category}', '${post}', '${imgName}', '${id}')`; // Consulta SQL para inserir um novo post

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            res.redirect('/home'); // Redireciona para a página principal
        })

    } catch (err) {
        console.error('Erro:', err);
        res.status(500).send('Erro ao adicionar dados!');
    }
});

// Rota para visualizar um post específico com seus comentários
app.get('/home/post/:id', (req, res) => {
    const postID = req.params.id; // Obtém o ID do post dos parâmetros da URL

    const correioSql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE Correios.id = ${postID}`; // Consulta SQL para buscar os dados do post

    const commentSql = `SELECT Comments.*, Users.username, Users.name_
        FROM Comments JOIN Users ON Comments.user_id = Users.id
        WHERE Comments.correio_id = ${postID} 
        ORDER BY Comments.created_at DESC`; // Consulta SQL para buscar os comentários do post

    conn.query(correioSql, function (err, postData) { // Executa a consulta SQL para buscar o post
        if (err) {
            console.log('erro: ', err)
            return res.status(500).send('Erro ao obter o Post!')
        }

        conn.query(commentSql, function (err, commentData) { // Executa a consulta SQL para buscar os comentários
            if (err) {
                console.log('erro: ', err)
                commentData = []; // Inicializa comentários como vazio em caso de falha
            }

            res.render('correio', { css: '/style/correio.css', title: '', user: req.session.user, correio: postData[0], comments: commentData, id: postID });
        })
    })
});

// Rota para a página de edição de um post
app.get('/home/edit/:id', checkAuth('Você precisa estar logado para editar um post!'), checkOwnership('Você não tem permissão para editar este post!'), (req, res) => {
    const id = req.params.id; // Obtém o ID do post dos parâmetros da URL

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE Correios.id = ${id}`; // Consulta SQL para buscar os dados do post

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err);
            return;
        }

        const dataCorreio = data[0]; // Obtém o primeiro resultado da consulta (dados do post)

        res.render('updateCorreio', { css: '/style/updateCorreio.css', title: '', dataCorreio })
    })
});

// Rota para atualização de um post
app.post('/correio/update', upload.single('image'), async (req, res) => {
    try {
        // Obtém os dados do corpo da requisição
        const id = req.body.id;
        const title = req.body.title;
        const category = req.body.category;
        const post = req.body.post;

        let imgName = req.body.imageName; // Inicializa o nome da imagem como o nome existente

        if (req.file) {
            const imgData = req.file.buffer;
            imgName = req.file.originalname;
            await sharp(imgData).toFile(`uploads/${imgName}`);
        }

        const sql = `UPDATE Correios SET title = '${title}', category = '${category}', post = '${post}', imageName = '${imgName}' 
        WHERE id = ${id}`; // Consulta SQL para atualizar o post

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            res.redirect('/home');
        })

    } catch (err) {
        console.error('Erro:', err);
        res.status(500).send('Erro ao editar dados!');
    }
});

// Rota para remover um post 
app.get('/home/remove/:id', checkAuth('Você precisa estar logado para deletar um post!'), checkOwnership('Você não tem permissão para deletar este post!'), (req, res) => {
    const id = req.params.id; // Obtém o ID do post dos parâmetros da URL

    const sql = `DELETE FROM Correios WHERE id = ${id}`; // Consulta SQL para deletar o post

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err);
            return;
        }

        res.redirect('/home')
    })
});

// Rota para adicionar um comentário a um post
app.post('/home/correio/:id/comment', checkAuth('Você precisa estar logado para adicionar um comentário!'), (req, res) => {
    try {

        const id = req.session.user.id;
        const correioID = req.params.id;
        const comment = req.body.comment;

        const sql = `INSERT INTO Comments (comment_, user_id, correio_id)
        VALUES ('${comment}', '${id}', '${correioID}')`; // Consulta SQL para inserir um novo comentário

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            // Redireciona para a página do post com os comentários atualizados
            res.redirect(`/home/post/${correioID}`);
        })

    } catch (err) {
        console.error('Erro:', err);
        res.status(500).send('Erro ao adicionar dados!');
    }
});

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => { // Destroi a sessão do usuário
        if (err) {
            return res.status(500).send('Erro ao encerrar sessão!')
        }
        res.redirect('/')
    })
});

// Configuração da conexão com o banco de dados MySQL
const conn = mysql2.createConnection({
    host: 'localhost', // Endereço do servidor MySQL
    user: 'root', // Nome de usuário do MySQL
    password: 'root', // Senha do MySQL
    database: 'flight' // Nome do banco de dados
});

// Conexão com o banco de dados MySQL
conn.connect((err) => {
    if (err) {
        console.log(err); // Log de erro
        return;
    }

    console.log('Conectado ao MySQL'); // Log de sucesso na conexão
    app.listen(3001, () => {
        console.log('Servidor rodando na porta 3001'); // Log do servidor rodando na porta 3001
    });
});