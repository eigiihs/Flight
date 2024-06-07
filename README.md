# ![Flight](https://github.com/eigiihs/Flight/assets/141264425/467a4174-01a1-40a4-9b5d-0ad9b4b10d23)

**Flight** consiste em uma rede social que permite aos usuários a criação de posts sobre uma variedade de temas, compartilhamento de imagens e interação com outros membros da comunidade a partir da publicação de comentários.
Desenvolvida como parte de um projeto do curso técnico, Flight é uma demonstração das habilidades técnicas adquiridas ao longo do curso, integrando as tecnologias de Node.js para o back-end e MySQL para gestão de banco de dados.

### 👩🏻‍💻 Tecnologias Utilizadas:
- **Node.js:** _A base do back-end do Flight, utilizada para gerenciar as rotas, processar requisições, e garantir que todas as funcionalidades do site operem de maneira eficiente._
- **MySQL:** _Utilizado para a gestão do banco de dados do Flight. Com ele, armazenamos de forma organizada todas as informações dos usuários, posts, comentários e imagens._
- **Handlebars:** _Handlebars é a ferramenta de templating que usamos para renderizar as páginas do Flight._


### 📚 Bibliotecas:
- **Express:** _Utilizado para a criação de aplicação WEB e APIs. Ele simplifica o roteamento, o manuseio de solicitações e respostas, e a integração com middlewares._
- **Express-Handlebars:** _Biblioteca utilizada para a criação de um HTML dinâmico usando templates._
- **MySQL2:** _Desempanha a função de conectar o banco de dados SQL, executando consultas e manipulando dados._
-  **Multer:** _Usado para a manipulação de dados, ele facilita o processo de upload de arquivos em uma aplicação Node.js._
-  **Sharp:** _Biblioteca para a manipulação de imagens, o Sharp consegue otimizar imagens antes de salvá-las no servidor ou usá-las em sua aplicação._
-  **Cors:** _Permite que sua aplicação web seja acessível a partir de diferentes domínios, o que é essencial para APIs que precisam ser consumidas por clientes hospedados em outros domínios._
-  **Express-Session:** _Ele possibilita que você mantenha dados entre requisições HTTP de um mesmo usuário, usado para a lógica de login._
-  **Path:** _Módulo utilizado para a manipulação de caminhos de arquivos e diretórios._
-  **Moment:** _Biblioteca usada para a manipulação de datas em JavaScript._
---

### 📌 Pré-Requisitos
**Antes de iniciar você deve ter instalado em sua máquina as seguintes ferramentas:** <br>
- [Node.js](https://nodejs.org/en) <br>
- [MySQL](https://www.mysql.com/) <br>
- E um editor para trabalhar o código como o [VSCode](https://code.visualstudio.com/)

---

### 🎡 Rodando a Aplicação
#### No terminal
1. **Clone este repositório:**
```
$ git clone https://github.com/eigiihs/Flight.git
```
2. **Instale o node_modules:**
```
$ npm i
```
3. **Instale todas as bibliotecas citadas acima:**
```
$ npm i nome_da_biblioteca
```
4. **Importe o banco de dados utilizando o arquivo Flight.sql**
-  Copie e cole o conteúdo do arquivo: [Flight.sql](/Flight.sql) no MySQL Workbench do seu computador e execute o script para criar as tabelas.
5. **Inicie o servidor**
```
npm start
```
### Agora é só acessar http://localhost:3001 e aproveitar! ✨

---

### Desenvolvido por:

| [<img loading="lazy" src="https://avatars.githubusercontent.com/u/141264425?v=4" width=115><br><sub>Giovanna Sousa</sub>](https://github.com/eigiihs) |  [<img loading="lazy" src="https://avatars.githubusercontent.com/u/141264235?v=4" width=115><br><sub>Sarah Cruz</sub>](https://github.com/sarinhallz) |  [<img loading="lazy" src="https://avatars.githubusercontent.com/u/141264311?v=4" width=115><br><sub>Maria Eduarda</sub>](https://github.com/marianascimento07) |
| :---: | :---: | :---: |
