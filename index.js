const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql2');
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
const upload = multer({storage: storage});

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('index', {css: '/style/home.css', title: ''})
});

app.get('/create', (req, res) => {
    res.render('newCorreio', {css: '', title: ''})
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try{

        const imgName = req.file.originalname;
        const imgData = req.file.buffer;

        await sharp(imgData).toFile(`uploads/${imgName}`);

        res.send('Imagem salva com sucesso!')

    } catch (error) {
        res.status(500).send('Erro ao salvar imagem!')
    }
});

/* app.get('/login', (req, res) => {
    res.render('login', {css: '/style/login.css', title: '| Login'})
});

app.get('/signUp', (req, res) => {
    res.render('signUp', {css: '/style/login.css', title: '| Cadastre-se'})
}); */

app.listen(3001);