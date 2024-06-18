const express = require('express');
const mongoose = require('mongoose');
const app = express();
const stuffRoutes = require('./routes/stuff')
const importRoute = require('./routes/importRoute')
const bodyParser = require('body-parser')


// connection a la bdd distante
mongoose.connect('mongodb+srv://***:****@cluster0.j5za9ah.mongodb.net/dofHelper?retryWrites=true&w=majority')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


// Pour eviter l'erreure cross origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// parse application/json
app.use(bodyParser.json())

// liste des route
app.use('/stuff', stuffRoutes)
app.use('/import', importRoute);



module.exports = app;
