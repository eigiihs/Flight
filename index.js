const express = require('express');
const exphbs = require('express-handlebars');
const mysql = require('mysql2');

const app = express();

app.use(express.json());
app.use(express.static('assets'));

app.use(
    express.urlencoded({
        extended: true
    })
);

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('login', {css: '/style/login.css', title: 'Login'})
});

app.listen(3001);