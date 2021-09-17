const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const morgan = require('morgan');
const pool = require('./database');
const exphbs = require('express-handlebars');
const validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const http = require('http');
const rxjs = require('rxjs');
const multer = require('multer');
const bodyParser= require('body-parser');
const { dirname } = require('path');
const { database } = require('./keys');
var cookieParser = require('cookie-parser');


//inicializar
const app = express();
require('./lib/passport');


//setings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    layout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname:'.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine','.hbs');
//middlewares
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,'./public/img/productos'));
    },
    filename: function (req, file, cb) {
        cb(null, req.params.id_produ+'.jpg');
    }
});

var upload = multer({ storage: storage })
app.use(cookieParser());

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    secret: 'fsociety',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
  }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

//variables globales
app.use((req, res, next) => {
    app.locals.message = req.flash('message');
    app.locals.success = req.flash('success');
    app.locals.user = req.user;
    next();
  });
//rutas

app.use(require('./routes'));
app.use('/menu',require('./routes/menu'));
app.use('/dashboard',require('./routes/dashboard'));
app.use('/authentication',require('./routes/authentication'));

//publico
app.use(express.static(path.join(__dirname,'public')));
//iniciar server
app.listen(app.get('port'),() =>{
     app.get('port');
});


app.post('/images/upload/:id_produ', upload.single('imagen'), async (req, res) => {
    const id_produ = req.params.id_produ;
    await pool.query('update productos set imagen="/img/productos/' + id_produ + '.jpg" where id_produ=' + id_produ);
     
    res.redirect('back');
});
