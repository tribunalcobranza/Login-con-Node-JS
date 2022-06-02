// 1.- Invocamos a modulo instalado express. Express es un paquete con modulos
const express = require('express');
// para utilizar todos los métodos que nos ofrece la librería express
const app = express();

//para poder trabajar con formato json sin errores usar "json encode"
//2.- Seteamos url encode para capturar los datos del formulario y que no tengamos errores
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//3.- Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

//4.- Setear el directorio public
app.use('/resources', express.static('public'));
app.use('/resources', express.static(__dirname + '/public'));

//5.- Setear el motor de plantillas
app.set('view engine', 'ejs');

//6.- Invocamos al módulo bcryptjs
const bcrypt = require('bcryptjs');

// 7.- Variables de sesión
const session = require('express-session');
app.use(session({
    secret: 'secret',
    reserve: true,
    saveUninitialized: true
}));

//8.- Invocamos al módulo de conexión de la BD 
const connection = require('./database/db');
const bcryptjs = require('bcryptjs');
//const bcryptjs = require('bcryptjs');

//9.- Estableciendo las rutas
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/register', (req, res) => {
    res.render('register');
})

//10.- Registración (Capturamos datos ingresados en el formulario)
//10 - Método para la REGISTRACIÓN
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', { user: user, name: name, rol: rol, pass: passwordHash }, async (error, results) => {
        if (error) {
            console.log(error);
        } else {
            res.render('register', {
                alert: 'true',
                alertTitle: 'Registration',
                alertMessage: 'Successful Registration',
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 1500,
                ruta: ''

            })
        }
    })
})

//11.- Autenticación
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHash = await bcryptjs.hash(pass, 4);
    if (user && pass) {
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
            if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                // sweetalert2 para visualizar mas bonito
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o password incorrectas",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: false,
                    ruta: 'login'
                });
                //Mensaje simple y poco vistoso
                //res.send('Incorrect Username and/or Password!');
            } else {
                //creamos una variable de session y le asignamos true si INICIO SESSION. Se utiliza en línea 123       
                req.session.loggedin = true;
                //En la próxima linea se trae los nombres de la tabla usuario porque se inició sesion correctamente
                req.session.name = results[0].name
                res.render('login', {
                    alert: true,
                    alertTitle: "Conexión Exitosa",
                    alertMessage: "¡Login Correcto!",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                    ruta: ''
                });
            }

        })
    } else {
        res.render('login', {
            alert: true,
            alertTitle: "Advertencia",
            alertMessage: "¡Por favor ingrese un usuario y/ contraseña!",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta: ''
        });

    }

})

//12 - Método para controlar que está auth en todas las páginas
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index', {
            login: true,
            name: req.session.name
        });
    } else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión',
        });
    }
    res.end();
});

//función para limpiar la caché luego del logout
app.use(function (req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
});

//13.- //Logout
//Destruye la sesión.
app.get('/logout', function (req, res) {
    req.session.destroy(() => {
        res.redirect('/') // siempre se ejecutará después de que se destruya la sesión
    })
});

app.listen(3000, (req, res) => {
    console.log('SERVER RUNNING IN http://localhost:3000');
})
