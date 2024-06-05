const express = require('express');
const exphbs = require('express-handlebars');
const mysql2 = require('mysql2');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const moment = require('moment');


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

const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        formatDate: function (date) {
            return moment(date).format('DD-MM-YYYY HH:mm:ss');
        }
    }
});
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars');

function checkAuth(message) {
    return function (req, res, next) {
        if (!req.session.user) {
            req.session.message = message
            return res.redirect('/showMessage');
        }
        next();
    }
};

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
            return res.status(400).send('Username já existe! Faça login ou escolha outro.')
        }

        const sql = `INSERT INTO Users (username, name_, email, password_) 
        VALUES ('${username}', '${name}', '${email}', '${password}')`;

        conn.query(sql, function (err, data) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            const newUser = data.insertId;

            req.session.user = {id: newUser, username: username};
            console.log('User registrado e autenticado: ', req.session.user);

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

        res.render('index', { css: '/style/home.css', title: '', user: req.session.user, correios: data, category });
    })
});

app.get('/create', checkAuth('Você precisa estar logado para criar um post!'), (req, res) => {

    res.render('createCorreio', { css: '/style/newCorreio.css', title: '' });

});

app.get('/showMessage', (req, res) => {
    res.render('showMessage', { css: '/style/message.css', message: req.session.message });
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {

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

app.get('/home/post/:id', (req, res) => {
    const postID = req.params.id;

    const correioSql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE Correios.id = ${postID}`;

    const commentSql = `SELECT Comments.*, Users.username, Users.name_
        FROM Comments JOIN Users ON Comments.user_id = Users.id
        WHERE Comments.correio_id = ${postID} 
        ORDER BY Comments.created_at DESC`;

    conn.query(correioSql, function (err, postData) {
        if (err) {
            console.log('erro: ', err)
            return res.status(500).send('Erro ao obter o Post!')
        }

        conn.query(commentSql, function (err, commentData) {
            if (err) {
                console.log('erro: ', err)
                commentData = []
            }

            res.render('correio', { css: '/style/correio.css', title: '', user: req.session.user, correio: postData[0], comments: commentData, id: postID });
        })
    })
});

app.get('/home/edit/:id', checkAuth('Você precisa estar logado para editar um post!'), (req, res) => {
    const id = req.params.id;

    const sql = `SELECT Correios.*, Users.username, Users.name_ 
    FROM Correios JOIN Users ON Correios.user_id = Users.id 
    WHERE Correios.id = ${id}`;

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err);
            return;
        }

        const dataCorreio = data[0];

        res.render('updateCorreio', { css: '/style/updateCorreio.css', title: '', dataCorreio })
    })
});

app.post('/correio/update', upload.single('image'), async (req, res) => {
    try {

        const id = req.body.id;
        const title = req.body.title;
        const category = req.body.category;
        const post = req.body.post;

        let imgName = req.body.imageName;

        if (req.file) {
            const imgData = req.file.buffer;
            imgName = req.file.originalname;
            await sharp(imgData).toFile(`uploads/${imgName}`);
        }

        const sql = `UPDATE Correios SET title = '${title}', category = '${category}', post = '${post}', imageName = '${imgName}' 
        WHERE id = ${id}`;

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

app.get('/home/remove/:id', (req, res) => {
    const id = req.params.id;

    const sql = `DELETE FROM Correios WHERE id = ${id}`;

    conn.query(sql, function (err, data) {
        if (err) {
            console.log('erro: ', err);
            return;
        }

        res.redirect('/home')
    })
});

app.post('/home/correio/:id/comment', checkAuth('Você precisa estar logado para adicionar um comentário!'), (req, res) => {
    try {

        const id = req.session.user.id;
        const correioID = req.params.id;
        const comment = req.body.comment;

        const sql = `INSERT INTO Comments (comment_, user_id, correio_id)
        VALUES ('${comment}', '${id}', '${correioID}')`;

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }

            res.redirect(`/home/post/${correioID}`);
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