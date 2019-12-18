const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;

const db_url = 'mongodb://localhost:3030';
const client = new MongoClient(db_url, { useNewUrlParser: true });

const app = express();

client.connect().then(client => {
    const users_db = client.db('userdb');
    const recipes_db = client.db('recipes');

    const users = users_db.collection('users');
    users.createIndex({ 'login': '' }, { unique: true });

    let admin = {
        login: 'admin',
        name: '',
        surname: '',
        password: 'admin'
    };

    users.updateOne({}, { '$set': admin }, { upsert: true })
        .then(r => console.log(r.ops))
        .catch(e => console.error(e));

    const recipes = recipes_db.collection('recipes');

    app.locals.users = users;
    app.locals.recipes = recipes;
}).catch(e => app.render('err/404'));

app.set('view engine', 'pug');
app.set('views', './views');

app.disable('x-powered-by');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public/'));
app.use(session({ secret: 'adwoawjfinaf' }));

app.get('/', (req, res, next) => {
    console.log(req.session);
    res.render('index', { user: req.session.user });
});

const usersRouter = express.Router();

usersRouter.all('/submit', (req, res, next) => {
    if (!req.session.user) {
        res.render('err/403');
    } else {
        next();
    }
});

usersRouter.get('/login', (req, res, next) => {
    res.render('login');
});

usersRouter.get('/register', (req, res, next) => {
    res.render('register');
});

usersRouter.get('/submit', (req, res, next) => {
    res.render('submit', { user: req.session.user });
});

usersRouter.post('/register', (req, res, next) => {
    let user = {
        login: req.body.login,
        name: req.body.name,
        surname: req.body.surname,
        password: req.body.password
    };

    req.app.locals.users.insertOne(user).then(r => {
        res.redirect('/user/login');
    }).catch(e => {
        res.send('User already exists');
    });
});

usersRouter.post('/login', (req, res, next) => {
    let login = req.body.login;
    let pass = req.body.password;

    req.app.locals.users.findOne({
        '$and': [
            { 'login': login },
            { 'password': pass }
        ]
    }).then(user => {
        if (user) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.send('User not exists');
        }
    }).catch(e => {
        res.status(500);
        next();
    });
});

usersRouter.get('/logout', (req, res, next) => {
    req.session.user = undefined;
    res.redirect('/');
});

usersRouter.post('/submit', (req, res, next) => {
    let recipe = {
        submiter: req.session.user.login,
        name: req.body.name,
        brief: req.body.brief,
        ingridients: req.body.ingridients,
        actions: req.body.actions
    };

    req.app.locals.recipes.insertOne(recipe).then(r => {
        console.log(r.ops);
        res.status(201).send();
    }).catch(e => {
        console.error(e);
        res.status(500).send()
    });
});

const recipeRouter = express.Router();

recipeRouter.get('/catalogue', (req, res, next) => {
    req.app.locals.recipes.find({}).toArray().then(a => {
        console.log(a);
        res.render('catalogue', {recipes: a});
    }).catch(e => {
        res.status(500);
        next();
    });
});

recipeRouter.get('/recipe:id', (req, res, next) => {
    
});

app.use('/user', usersRouter);
app.use('/recipe', recipeRouter);

app.use((req, res, next) => {
    if (res.statusCode = 404) {
        res.render('err/404');
    }
});

module.exports = app;
