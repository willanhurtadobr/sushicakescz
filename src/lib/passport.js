const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'user_name',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, user_name, password, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE user_name = ?', [user_name]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(password, user.password)
    if (validPassword) {
      done(null, user, req.flash('success', 'bienvenido a  ' + user.user_name));
    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    return done(null, false, req.flash('message', 'The Username does not exists.'));
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'user_name',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, user_name, password, done) => {

  const { id_direc } = req.body;
  let newUser = {
    user_name,
    password,
    id_direc,
  
  };
  newUser.password = await helpers.encryptPassword(password);
  // Saving in the Database
  const result = await pool.query('INSERT INTO users SET ? ', [newUser]);
  newUser.id = result.insertId;
  return done(null, newUser);
}));
passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  done(null, rows[0]);
});