const fs = require('fs');
const path = require('path');
const multer = require('multer')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
    let username = req.query.username;
    let dirpath = "./files/" +userdept + "/" + username;
    cb(null, dirpath)
  },
  filename: function (req, file, cb) {
    // console.log(file); 
    cb(null, file.originalname);
    // cb(null, file.originalname + '-' + Date.now())
  }
})

var upload = multer({ storage: storage })

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    app.get('/files', isLoggedIn, function(req, res){
        // console.log(req); 
        // var folders;
        var items = [];
        console.log(req.user.role); 
        if(req.user.role == 'superadmin') {
            console.log('Inside Superadmin Role'); 
            items.push('Academics','Design','Finance','Marketing');
        } else {
            var department = req.user.department;
            items.push(department);
        }
        res.render('files.ejs', {
            fileobject: items
        });
        
        // var folders = ["Academics", "Finance", "Design", "Marketing"]; 
        
    });
    app.get('/folder',isLoggedIn, function(req, res){
        if(req.user.role == 'admin'){
            var userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
            var username ='';
            let dirpath = "./files/" +userdept;
            console.log(dirpath); 
            fs.readdir(dirpath, function (err, files) {
                //handling error
                if (err) {
                    return console.log('Unable to scan directory: ' + err);
                } 
                
                // Do whatever you want to do with the file
                res.render('folder.ejs', {
                    subfolobj: files,
                    username: req.user.firstname,
                }); 
                
            });
        } else {
            res.render('folder.ejs',{
                subfolobj: [req.user.firstname],
                username: req.user.firstname
            });
        }
        
        
        
    });
    app.get('/folder/user',isLoggedIn, function(req, res){
        var username = req.query.username;
        var userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
        let dirpath = "./files/" +userdept + "/" + username;
        // console.log(dirpath); 
        fs.readdir(dirpath, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            
            // Do whatever you want to do with the file
            res.render('userfile.ejs', {
                subfolobj: files,
                username: req.query.username,
            }); 
            
        });
        
    });

    // Files download request
    app.get('/folder/download',isLoggedIn, function(req, res){
        var username = req.query.username;
        var filename = req.query.filename;
        var userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
        let dirpath = "./files/" +userdept + "/" + username + "/" + filename;
        res.download(dirpath);
        
    });
    app.delete('/folder/user/:username/file/:filename',isLoggedIn, function(req, res){
        // var username = req.data.username;
        console.log("request", req);
        var username = req.params.username;
        console.log("username", username);  
        var filename = req.params.filename;
        // console.log(username);
        var userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
        let dirpath = "./files/" +userdept + "/" + username + "/" + filename;
        let dirpath1 = "./files/" +userdept + "/" + username;
        // console.log(dirpath); 
        fs.unlink(dirpath, function(err) {
            if (err) {
                return console.log('unable to delete', err); 
            }
            fs.readdir(dirpath1, function (err, files) {
            //handling error
                if (err) {
                    return console.log('Unable to scan directory: ' + err);
                } 
                
                // Do whatever you want to do with the file
                res.send(files);
                
            });
        })
        
    });
    app.post('/folder/user',isLoggedIn, upload.single('image'), function(req, res, next){

        let userdept = req.user.department.charAt(0).toUpperCase() + req.user.department.slice(1);
        var username = req.query.username;
        let dirpath = "./files/" +userdept + "/" + username;
        console.log(dirpath); 
        
        fs.readdir(dirpath, function (err, files) {
            //handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            } 
            
            // Do whatever you want to do with the file
            res.render('userfile.ejs', {
                subfolobj: files,
                username: req.query.username
            }); 
            
        });
        
    });
// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/files', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}




