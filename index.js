const express = require('express');
const exphbs = require('express-handlebars');
const mysql2 = require('mysql2');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const session = require('express-session');
const fs = require("fs");
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static('assets'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(session({
    secret: 'S%G@m#19!25^23',
    resave: false,
    saveUninitialized: true
}));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('login', { css: '/style/login.css', title: '| Login' })
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM Users WHERE username = '${username}'`;

    conn.query(sql, [username], (err, results) => {
        if (err) {
            console.log('erro: ', err);
            return false;
        }

        if (results.length === 0) {
            return res.status(400).render('login', { css: '/style/login.css', message: 'Usuário não encontrado!' })
        }

        const user = results[0];

        if (user.password_ !== password) {

            return res.status(400).render('login', { css: '/style/login.css', message: 'Senha Incorreta!' })
        }

        console.log('Usuário autenticado:', user)

        req.session.user = { id: user.id, username: user.username };
        console.log('Sessão do usuário:', req.session.user)
        res.redirect('/home');
    })
});

app.get('/signUp', (req, res) => {
    res.render('signUp', { css: '/style/login.css', title: '| Cadastre-se' })
});

app.post('/upSign', (req, res) => {
    const { username, name, email, password } = req.body;

    const checkUsername = `SELECT * FROM Users WHERE username = '${username}'`;
    conn.query(checkUsername, [username], (err, data) => {
        if (err) {
            console.log('erro: ', err);
            return false;
        }

        if (data.length > 0) {
            return res.status(400).send('Username já existe! Faça login ou escolha outra.')
        }

        const sql = `INSERT INTO Users (username, name_, email, password_) 
        VALUES ('${username}', '${name}', '${email}', '${password}')`;

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            res.redirect('/home');
        })
    })
});

app.get('/home', (req, res) => {

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id
    ORDER BY Correios.created_at DESC`;

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err)
            return
        }

        res.render('index', { css: '/style/home.css', title: '', user: req.session.user, correios: data });
    })
});

app.get('/home/category/:category', (req, res) => {
    const category = req.params.category;

    console.log(category)

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE category = '${category}'`;

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err)
            return
        }

        res.render('index', { css: '/style/home.css', title: '', user: req.session.user, correios: data, category});
    })
});

app.get('/create', (req, res) => {

    function checkAuth(req, res, next) {
        if (!req.session.user) {
            req.session.message = 'Você precisa estar logado para criar um post!';
            return res.redirect('/showMessage');
        }
        next();
    }

    checkAuth(req, res, () => {
        res.render('newCorreio', { css: '/style/newCorreio.css', title: '' });
    })
});

app.get('/showMessage', (req, res) => {
    res.render('showMessage', { message: req.session.message });
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send('Você precisa estar logado para criar um post!')
        }

        const id = req.session.user.id;
        const title = req.body.title;
        const category = req.body.category;
        const post = req.body.post;

        let imgName = null;
        if (req.file) {
            const imgData = req.file.buffer;
            imgName = req.file.originalname;
            await sharp(imgData).toFile(`uploads/${imgName}`);
        }

        const sql = `INSERT INTO Correios (title, category, post, imageName, user_id)
        VALUES ('${title}', '${category}', '${post}', '${imgName}', '${id}')`;

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            res.redirect('/home');
        })

    } catch (err) {
        console.error('Erro:', err);
        res.status(500).send('Erro ao adicionar dados!');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Erro ao encerrar sessão!')
        }
        res.redirect('/')
    })
});

const conn = mysql2.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'flight'
});

conn.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log('Conectado ao MySQL');
    app.listen(3001, () => {
        console.log('Servidor rodando na porta 3001');
    });
});