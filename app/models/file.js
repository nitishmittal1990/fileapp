// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var fileSchema = mongoose.Schema({
    useremail: String,
    role: String,
    department: String,
    filename: String
});



// create the model for users and expose it to our app
module.exports = mongoose.model('File', fileSchema);
