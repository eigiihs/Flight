const express = require('express');
const exphbs = require('express-handlebars');
const mysql2 = require('mysql2');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.static('assets'));
app.use(cors());

app.use(
    express.urlencoded({
        extended: true
    })
);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('index', { css: '/style/home.css', title: '' });
});

app.get('/create', (req, res) => {
    res.render('newCorreio', { css: '', title: '' });
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {

        const imgData = req.file.buffer;
        const imgName = req.file.originalname;
        const title = req.body.title;
        const category = req.body.category;
        const post = req.body.post;

        await sharp(imgData).toFile(`uploads/${imgName}`);

        const sql = `INSERT INTO Correios (title, category, post, imageName)
        VALUES ('${title}', '${category}', '${post}', '${imgName}')`;

        conn.query(sql, function (err) {
            if (err) {
                console.log('erro: ', err);
                return false;
            }
    
            res.redirect('/');
        })

    } catch (err) {
        console.error('Erro:', err);
        res.status(500).send('Erro ao adicionar dados!');
    }

});

/* app.get('/login', (req, res) => {
    res.render('login', {css: '/style/login.css', title: '| Login'})
});

app.get('/signUp', (req, res) => {
    res.render('signUp', {css: '/style/login.css', title: '| Cadastre-se'})
}); */

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