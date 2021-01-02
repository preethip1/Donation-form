var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
  usernameField: 'user[username]',
  passwordField: 'user[password]'
}, function (email, password, done) {
  User.findOne({ username: email }).then(function (user) {
    console.log("abc", user);
    if (!user || !user.validPassword(password)) {
      return done(null, false, { errors: { 'email or password': 'is invalid' } });
    }
    return done(null, user);
  }).catch(done);
}));

