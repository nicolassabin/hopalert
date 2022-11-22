var express = require('express');
var app = express();
var mongojs = require('mongojs');
var bodyparser = require('body-parser');
var httperror = require('http-errors');
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const {MPCONF} = require('../tools');
const {MLCONF} = require('../tools');
var db = mongojs('hopalert', ['users', 'codes', 'messages', 'attachments', 'partnercodes', 'tokens']);


app.use(express.static(__dirname + "/public"))
app.use(bodyparser.json());

const numSaltRounds = 10;

const SERVER_PORT = 3000;

// version number
const SERVER_VERSION = "v1.3 beta";

// app name definition
const APP_NAME = "WebCodex";
const EMAIL_NO_REPLAY = '"WebCodex" <no-reply@ywebcodex.fr>';
const EMAIL_FOOTER = '\n\nBien cordialement,\nL\'équipe support de WebCodex.\nCet email est certifé par WebCodex.';
const EMAIL_FOOTER_HTM = '<p>Bien cordialement,<br>L\'équipe support de WebCodex.<br>Cet email est certifé par WebCodex.';

// server feature config
const VERIF_MESSAGE_EMAIL = true;
const AUTO_USER_CREATION = true;
const LIMIT_ITEM_CODE_PER_USER = 4;
const TOKEN_PERIOD_EXPIRATION = 86400; // 1 jour,

function wait(ms)
{
    var d = new Date();
    var d2 = null;
    do { d2 = new Date(); }
    while(d2-d < ms);
}


function checkCodePermission(codeValue, errorIfCodeFound, onSuccessCode, onError)
{
    // chech code existence
    console.log("checkCodePermission checking code " + codeValue);
    db.codes.findOne({Value: codeValue},  function (error, codefound) {
        if (error) {
            console.log("checkCodePermission error");
            console.error(error);
            //return onError(error.statusCode);
            return onError(error.statusCode, error.message);
        } else if (codefound) {
            console.log("checkCodePermission code already registered : " +  codefound.Value);
            if (errorIfCodeFound)
            {
                return onError(409, "Le code a déjà été enregistré.");    
            }
            else
            {
                return onSuccessCode(codefound);
            }
            
        }
        else
        {
            console.log("checkCodePermission code not registered");
            if (errorIfCodeFound)
            {
                return onSuccessCode(null);
            }
            else
            {
                return onError(404, "Le code n'existe pas!");
            }
        }
    });
    
}

function checkBodyUserPermission(req, onSuccess, onError)
{
    console.log("checkBodyUserPermission autocreation ");
    console.log("checkBodyUserPermission autocreation req.body.Email " +
        req.body.Email 
        + " req.body.Password " + req.body.Password);
    
    if (req.body.Email != null && req.body.Password != null)
    {
        checkUserPermission(false, req, req.body.Email, req.body.Password, onSuccess, onError);
    }
    else
    {
        console.log("checkBodyUserPermission invalid data");
        return onError(412, "Votre email et votre mot de passe sont incorrects!");
    }
}

function checkHeaderUserPermission(autocreation, req, onSuccess, onError)
{
    console.log("checkHeaderUserPermission autocreation ");
    var user_email = Buffer.from(req.headers['user_email'], 'base64').toString('utf8'); // auth is in base64(username:password)  so we need to decode the base64
    var user_password = Buffer.from(req.headers['user_password'], 'base64').toString('utf8'); // auth is in base64(username:password)  so we need to decode the base64
    checkUserPermission(autocreation, req, user_email, user_password, onSuccess, onError);
}

function checkUserPermission(autocreation, req, user_email, user_password, onSuccess, onError)
{
    console.log("checkUserPermission autocreation " + autocreation);
    
    if (user_email != null && user_password != null)
    {
        // chech user existence
        user_email.toLowerCase();
        console.log("checkUserPermission checking user " + user_email);
        db.users.findOne({ Email: user_email}, function (error, userfound) {
            if (error) {
                console.log("checkUserPermission error");
                console.error(err);
                return onError(error.statusCode, error.message);
            } else if (userfound) {
                console.log("checkUserPermission user is found : " +  user_email);
                // Make sure the user has been verified
                if (userfound.Status <= 0) {
                    console.log("checkUserPermission user not-verified : ");
                    return onError(423, "Votre email n\'a été validé.!");
                }

                // check first is value is crypted
                if (userfound.Password != user_password)
                {
                    console.log("checkUserPermission user not authorized compare value as crypted");
                    bcrypt.compare(user_password, userfound.Password, function (err, result) {
                        if (result === true) {
                            console.log("checkUserPermission bcrypt.compare true");
                            return onSuccess(userfound, false);
                        } else {
                            console.log("checkUserPermission user not authorized ");
                            return onError(403, "Votre email et votre mot de passe sont incorrects!");
                        }
                    });
                }
                else
                {
                    return onSuccess(userfound, false);
                }
            }
            else
            {
                console.log("checkUserPermission user not found ");
                if(autocreation)
                {
                    var user = {}; 
                    user.Email = user_email;
                    user.Password = user_password;
                    console.log("checkUserPermission user call auto creation ");
                    createUser(user, req, function onSuccessCreateUser(useri){
                        console.log("checkUserPermission auto creation onSuccess");
                        onSuccess(useri, true);
                    }, function onErrorCreateUser(errcode, errmsg){
                        //res.status(errcode).send({ msg: errmsg });
                        console.log("checkUserPermission auto creation onError " + errcode);
                        onError(401, "Votre email et votre mot de passe sont incorrects!"); 
                    });
                }
                else
                {
                    return onError(401, "Votre email et votre mot de passe sont incorrects!");   
                }
                
            }
        });
    }
    else
    {
        console.log("checkUserPermission invalid data");
        return onError(412, "Votre email et votre mot de passe sont incorrects!");
    }
    
    
}

function checkUserTokenPermission(req, onSuccess, onError)
{
    console.log("checkUserTokenPermission");
    var token = Buffer.from(req.headers['token'], 'base64').toString('utf8'); // auth is in base64(username:password)  so we need to decode the base64
    
    // for the moment the token is the user id.
    // it will be changed later as a real token
    if (token != null)
    {
        // chech user existence
        console.log("checkUserTokenPermission checking token " + token);
        db.users.findOne({_id: mongojs.ObjectId(token)}, function (error, userfound) {
            if (error) {
                console.log("checkUserTokenPermission error");
                console.error(err);
                return onError(error.statusCode, error.message);
            } else if (userfound) {
                console.log("checkUserTokenPermission user is found : " +  token);
                // Make sure the user has been verified
                if (userfound.Status <= 0) {
                    console.log("checkUserTokenPermission user not-verified : ");
                    return onError(423, "Votre email n\'a été validé.!");
                }
                return onSuccess(userfound);
            }
            else
            {
                console.log("checkUserTokenPermission user not found ");
                return onError(401, "Votre email et votre mot de passe sont incorrects!");
            }
        });
    }
    else
    {
        console.log("checkUserTokenPermission data invalid ");
        return onError(401, "Votre email et votre mot de passe sont incorrects!");
    }
    
}


function createUser(user, req, onSuccess, onError)
{
    user.Status = 0;
    var dt = new Date();
    user.DateCreated = dt;
    user.DateUpdated = dt;
    // remove the account automatically if not valdated and when the token has expired
    db.users.createIndex( {DateCreated: 1}, {
        expireAfterSeconds: TOKEN_PERIOD_EXPIRATION,
        partialFilterExpression: {
            Status: 0
        }
    });

    bcrypt.genSalt(numSaltRounds, function(err, salt) {
        if (err) {
            console.log("createUser error genSalt " + err);
            return onError(401, err.message);
        }
        // hash/crypt the password
        console.log("createUser hash user.email " + user.Email);
        console.log("createUser hash user.password " + user.Password);
        bcrypt.hash(user.Password, salt, function (err, hash){
            if (err) {
                console.log("createUser error unable to crypt the password " + err);
                return onError(401, err.message);
            }
            console.log("createUser password correctly crypted");
            user.Password = hash;
            db.users.insert(user, function(err, docs){
            
                console.log(docs);
                console.log("createUser create token for verification ");
                //https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb
                // Create a verification token for this user
                //var token = new token({ _userId: docs._id, token: crypto.randomBytes(16).toString('hex') });
                // Save the verification token

                db.tokens.createIndex( { DateCreated: 1 }, { expireAfterSeconds: TOKEN_PERIOD_EXPIRATION } )
                db.tokens.insert({ ObjectId: docs._id, token: crypto.randomBytes(16).toString('hex'), CreationDate: dt }, function(err, token) {
                    if (err) { 
                        console.log("createUser create token for verification error ");
                        return onError(500, err.message);
                    }
         
                    // Send the email
                    console.log("createUser link " + req.headers.host + '\/user_register_confirmation.html?token="' + token.token + '"');
                    
                    //var mailOptions = { from: 'no-reply@yourwebapplication.com', to: user.email, 
                    // subject: 'Account Verification Token', text: 'Hello,\n\n' + 
                    // 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
                    var mailOptions = { from: EMAIL_NO_REPLAY, 
                        to: docs.Email, 
                        bcc:  'hopalert.cie@gmail.com', // copy to the admin master
                        subject: APP_NAME + ': Jeton de vérification de votre compte', 
                        text: 'Bonjour,\n\n' + 'Vous avez fait une demande pour créer votre compte.\nSi vous êtes bien l\'auteur de cette demande, alors merci de valider votre compte en cliquant sur le lien: \nhttp:\/\/' + req.headers.host + '\/user_register_confirmation.html?token=' + token.token + '\n' + EMAIL_FOOTER };
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) { 
                            console.log("createUser error sending confirmation email ");
                            return onError(500, err.message);
                        }
                        console.log("createUser link " + req.headers.host + '\/user_register_confirmation\/' + token.token);
                        docs.Password = "";
                        return onSuccess(docs);
                    });
                    
                }); 
            });
        });
    });
    
}

var transporter = nodemailer.createTransport({
                          host: 'smtp.gmail.com',
                          port: 465,
                          secure: true,
                          auth: {
                              user: MLCONF,
                              pass: MPCONF
                          }
                      });


app.post('/user/register', function(req, res){
    console.log("registerUser " + req.body);
    
    var user_email = req.body.Email; // auth is in base64(username:password)  so we need to decode the base64
    var user_password = req.body.Password; // auth is in base64(username:password)  so we need to decode the base64
    
    if (user_email != null && user_password != null)
    {
        // chech user existence
        user_email.toLowerCase();
        console.log("registerUser checking user " + user_email);
        db.users.findOne({ Email: user_email}, function (err, userfound) {
            if (err) {
                console.log("registerUser checking user error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (userfound) {
                console.log("registerUser user is found : " +  user_email);
                console.log("registerUser user not authorized ");
                res.status(403).json({ msg: "Le compte existe déjà!" });
            }
            else
            {
                console.log("registerUser user not found ");
                var user = req.body;
                createUser(user, req, function onSuccess(docs){
                    console.log("registerUser createUser onSuccess");
                    res.json(docs);
                }, function onError(errcode, errmsg){
                    console.log("registerUser createUser onError " + errcode);
                    res.status(errcode).send({ msg: errmsg });
                });
            }
        });
    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }

});

function confirmToken(collection, token, res, onSuccess)
{
    if (token != null && collection != null)
    {
        db.tokens.findOne({ token: token}, function (err, doc) {
            if (err) {
                console.log("confirmToken checking user token error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (doc) {
                console.log("confirmToken token has been is found : " +  doc.token);
                console.log("confirmToken update status object id " + doc.ObjectId);
                
                /*if (user.Status == 1)
                {
                    console.log("userConfirmation already validated");
                    return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });
                }*/
 
                // update object status
                collection.findAndModify({query :{_id: mongojs.ObjectId(doc.ObjectId)},
                    update: {$set: {Status: 1, DateUpdated : new Date() }}, new: true},  function(err, docobj){
                    if (err) {
                        console.log("confirmToken update user status error");
                        console.error(err);
                        return res.status(err.statusCode).json({ msg: err.message });
                    } else if (docobj) {
                        // delete the token
                        console.log("confirmToken remove token : " + doc._id);
                        db.tokens.remove({_id: mongojs.ObjectId(doc._id)}, function(error, docremove){
                            if (error) {
                                console.log("confirmToken delete token error");
                                console.error(error);
                                return res.status(err.statusCode).json({ msg: err.message });
                            } else if (docremove) {
                                console.log("confirmToken successfull");
                                onSuccess(docobj);
                            }
                        })
                        
                    }
                });
            }
            else
            {
                console.log("confirmToken token not found ");
                res.status(401).json({ msg: "Désolé, vous avez trop tardé et le lien n'est plus valide!" });
                // remove the object
            }
        });
    }
    else
    {
        console.log("confirmToken token invalid!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }
}

app.post('/user/confirmation/:id', function(req, res){
    console.log("userConfirmation token:" + req.params.id);
    
    confirmToken(db.users, req.params.id, res, function(doc){
        res.json(doc);
    });
});

app.post('/user/login', function(req, res){
    console.log("loginUser " + req.body);
    
    var user_email = req.body.Email; 
    var user_password = req.body.Password;
    
    if (user_email != null && user_password != null)
    {
        // for testing
        //wait(2000);
        // chech user existence
        user_email.toLowerCase();
        console.log("loginUser checking user " + user_email);
        db.users.findOne({ Email: user_email}, function (err, doc) {
            if (err) {
                console.log("loginUser checking user error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (doc) {
                console.log("loginUser user is found : " +  doc._id);
                
                bcrypt.compare(user_password, doc.Password, function (err, result) {
                    if (result === true) {
                        console.log("loginUser password bcrypt.compare true");
                        // Make sure the user has been verified
                        if (doc.Status <= 0) {
                            console.log("loginUser user not-verified : ");
                            return res.status(401).json({ type: 'not-verified', msg: 'Votre compte n\'a été vérifié.' }); 
                        }
                        res.json(doc); 
                    } else {
                        console.log("loginUser user not authorized ");
                        res.status(403).json({ msg: "Vos identifiants sont incorrects!" });
                    }
                });
            }
            else
            {
                console.log("loginUser user not found ");
                res.status(403).json({ msg: "Vos identifiants sont incorrects!" });
            }
        });
    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }

});

app.post('/user/resendPassword', function(req, res){
    var user = req.body;
    console.log("resendPassword " + user.Email);
    // chech user existence
    if (user.Email != null)
    {
        var user_email = user.Email;
        user_email.toLowerCase();
        console.log("resendPassword checking user " + user_email);

        console.log("resendPassword check Permission onSuccessUser ");
        db.users.findOne({ Email: user_email}, function (err, doc) {
            if (err) {
                console.log("resendPassword find user error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (doc) {
                console.log("resendPassword user is found : " +  doc._id);
                
                // TODO check if user id is the same if id has been rensmit by the client
                if (user._id != null )
                {
                    console.log("resendPassword check user id: " +  user._id);
                    if (user._id != doc._id)
                    {
                        console.log("resendPassword check user id failed !");
                        return res.status(401).json({ msg: "Vos identifiants ne sont pas corrects!" });
                    }
                }

                var dt = new Date();
                db.tokens.insert({ ObjectId: doc._id, token: crypto.randomBytes(16).toString('hex'), CreationDate: dt }, function(err, token) {
                    if (err) { 
                        console.log("resendPassword create token for verification error ");
                        return res.status(500).send({ msg: err.message }); 
                    }
         
                    // Send the email
                    console.log("resendPassword link " + req.headers.host + '\/user_reinit_password.html?token="' + token.token + '"');
                    
                    //var mailOptions = { from: 'no-reply@yourwebapplication.com', to: user.email, 
                    // subject: 'Account Verification Token', text: 'Hello,\n\n' + 
                    // 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
                    var mailOptions = { from: EMAIL_NO_REPLAY, 
                        to: doc.Email, 
                        subject: APP_NAME + ': Jeton de reinitialisation de votre mot de passe', 
                        text: 'Bonjour,\n\n' + 'Vous avez fait une demande pour réinitialiser votre mot de passe.\nSi vous êtes bien l\'auteur de cette demande, alors merci de cliquer sur le lien: \nhttp:\/\/' + req.headers.host + '\/user_reinit_password.html?token=' + token.token + '\n' + EMAIL_FOOTER};
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) { 
                            console.log("resendPassword error sending confirmation email ");
                            return res.status(500).send({ msg: err.message }); 
                        }
                        console.log("resendPassword send redirection by email sucessfull");
                        doc.Password = "";
                        res.json(doc);
                    });
                    
                });
            }
            else
            {
                console.log("resendPassword user not found ");
                //res.status(403).json({ msg: "Votre identifiant n'existe pas!" });
                var mailOptions = { from: EMAIL_NO_REPLAY, 
                    to: user_email, 
                    subject: APP_NAME + ': Jeton de reinitialisation de votre mot de passe', 
                    text: 'Bonjour,\n\n' + 'Votre identifiant n\'existe pas.\nVeuillez contacter le support en cliquant \nhttp:\/\/' + req.headers.host + '\/contact.html' + '\n' + EMAIL_FOOTER};
                transporter.sendMail(mailOptions, function (err) {
                    if (err) { 
                        console.log("resendPassword error sending confirmation email ");
                        return res.status(500).send({ msg: err.message }); 
                    }
                    console.log("resendPassword send redirection by email sucessfull");
                    res.status(200).json({ msg: "" });
                });
            }
        });
    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }

});

app.post('/user/confirmationPassword/:id', function(req, res){
    console.log("userconfirmationPassword token:" + req.params.id);
    var user = req.body;

    confirmToken(db.users, req.params.id, res, function(docuser){
        console.log("userconfirmationPassword finduser ");
        if (docuser) {
            console.log("userconfirmationPassword finduser successfull ");
            
            // update password
            // user has the new password
            bcrypt.genSalt(numSaltRounds, function(err, salt) {
                    if (err) {
                        console.log("userconfirmationPassword error genSalt " + err);
                        return onError(401, err.message);
                    }
                    // hash/crypt the password
                    console.log("userconfirmationPassword hash user.email " + user.Email);
                    console.log("userconfirmationPassword hash user.password " + user.Password);
                    bcrypt.hash(user.Password, salt, function (err, hash){
                        if (err) {
                            console.log("userconfirmationPassword error unable to crypt the password " + err);
                            return onError(401, err.message);
                        }
                        console.log("userconfirmationPassword password correctly crypted, try to update it in db");
                        docuser.Password = hash;

                        db.users.findAndModify({query :{_id: mongojs.ObjectId(docuser._id)},
                            update: {$set: {Password: docuser.Password,
                                DateUpdated : new Date()}}, 
                            new: true},  function(err, docs){
                            if (err) {
                                console.log("userconfirmationPassword error unable to crypt the password " + err);
                                return onError(401, err.message);
                            }
                            console.log("userconfirmationPassword update the password sucessfull");
                            docs.Password = "";
                            res.json(docs);
                        });

                    });
                });

        }
        else
        {
            console.log("messageConfirmation Internal error ");
            res.status(500).json({ msg: "Internal error" });
        }
    });
});

app.delete('/user/:id', function(req, res){
    var id = req.params.id;
    console.log("delete user ");
    if (id != null)
    {
        checkHeaderUserPermission(false, req, function onSuccessUser(user, userautocreated){
            console.log("delete user check id matching " + id
                + " userpermission " + user._id);
            if (id == user._id)
            {
                db.users.remove({_id: mongojs.ObjectId(id)}, function(err, docs){
                    // delete all messages and all codes
                    console.log("delete codes of the user " + id);
                    db.codes.remove({UserId: mongojs.ObjectId(id)});
                    console.log("delete messages of the user " + id);
                    db.messages.remove({To: user.Email});
                    res.json(docs);
                }); 
            }
            else
            {
                console.log("delete user id macthing failed, permission denied");
                res.status(401).json({ msg: "Vos identifiants ne sont pas corrects!" });
            }
            
        }, function onErrorUser(errcode, errmsg){
            console.log("delete user checkUserPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        }); 
        
    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }
    
});

app.get('/user/:id', function(req, res){
    var id = req.params.id;
    if (id != null)
    {
        console.log("retrieve the user " + id);

        checkBodyUserPermission(req, function onSuccessUser(user, userautocreated){
            console.log("retrieve the user check id matching " + id
                + " userpermission " + user._id);
            if (id == user._id)
            {
                console.log("retrieve the user find and update sucessfull");
                db.users.findOne({_id: mongojs.ObjectId(id)}, function(err, docs){
                    console.log("retrieve the user find and update sucessfull");
                    res.json(docs);
                });
            }
            else
            {
                console.log("retrieve the user id macthing failed, permission denied");
                res.status(401).json({ msg: "Vos identifiants ne sont pas corrects!" });
            }
            
        }, function onErrorUser(errcode, errmsg){
            console.log("retrieve the user checkUserPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });

    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }
});


app.put('/user/:id', function(req, res){
    var id = req.params.id;
    console.log("put the user ");
    if (id != null)
    {
        checkBodyUserPermission(req, function onSuccessUser(user, userautocreated){
            console.log("put the user check id matching " + id
                + " userpermission " + user._id);
            if (id == user._id)
            {
                console.log("put the user find and update");
                db.users.findAndModify({query :{_id: mongojs.ObjectId(id)},
                    update: {$set: {FirstName: req.body.FirstName, LastName: req.body.LastName, 
                        Email: req.body.Email, 
                        Mobile: req.body.Mobile,
                        Facebook: req.body.Facebook,
                        Password: req.body.Password,
                        Status: req.body.Status,
                        DateUpdated : new Date()}}, 
                    new: true},  function(err, docs){
                        console.log("put the user find and update sucessfull");
                        res.json(docs);
                    });
            }
            else
            {
                console.log("put the user id macthing failed, permission denied");
                res.status(401).json({ msg: "Vos identifiants ne sont pas corrects!" });
            }
            
        }, function onErrorUser(errcode, errmsg){
            console.log("put the user checkUserPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });

    }
    else
    {
        console.log("Invalid data parameter!");
        res.status(500).json({ msg: "Invalid data parameter!" });
    }
    
});

// codes
app.get('/codes', function(req, res){
    console.log("received getCodes from controller");
    
    // check code permission first
    checkUserTokenPermission(req, function onSuccessUser(user){
        console.log("getCodes user matched ");
        db.codes.find({UserId: mongojs.ObjectId(user._id)}, function(err, docs){
            if (err) {
                console.log("getCodes remove error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (docs) {
                console.log("getCodes success " + docs);
                res.json(docs);
            } 
            else
            {
                console.log("getCodes Internal error ");
                res.status(500).json({ msg: "Internal error" });
            }
        })
    }, function onErrorUser(errcode, errmsg){
        console.log("getCodes checkUserTokenPermission failed ret status: " + errcode);
        res.status(errcode).json({ msg: errmsg });
    });
    
});

function getObjectType(type){
    switch (type)
    {
        case 1: return "Porte-Clés";
        case 2: return "Véhicule";
        case 3: return "Téléphone";
        case 4: return "Vélo";
        case 5: return "Bijoux";
        case 6: return "Autres";
        default: return "Porte-Clés";
    }
}

function getObjectComment(description, linebreak){
    if (description == null)
        return '';
    return '  - Commentaires éventuels: ' + description + linebreak;
}

app.post('/code', function(req, res){
    console.log("postCode code  " + req.body.Value);

    // check user permission first
    checkHeaderUserPermission(AUTO_USER_CREATION, req, function onSuccessUser(user, userautocreated){
        console.log("postCode user matched ");
        var code = req.body; 
        var codeValue = code.Value;
        // check code permission
        checkCodePermission(codeValue,  true, function onSuccessCode(codef){
            console.log("postCode checkCodePermission code not found success ");
            code.UserId = user._id;

            // check if limit od number of code has been reached
            db.codes.find({UserId: mongojs.ObjectId(user._id)}, function(err, docs){
                if (err) {
                    console.log("postCode find error");
                    console.error(err);
                    return res.status(err.statusCode).json({ msg: err.message });
                } else if (docs) {
                    console.log("postCode find count " + docs.length);
                    if( docs.length < LIMIT_ITEM_CODE_PER_USER)
                    {
                        // insert the new code
                        var dt = new Date();
                        code.DateCreated = dt;
                        code.DateUpdated = dt;
                        db.codes.insert(code, function(err, doc){
                            if (err) {
                                console.log("postCode insert error");
                                console.error(err);
                                return res.status(err.statusCode).json({ msg: err.message });
                            } else if (doc) {
                                console.log("postCode success " + doc);

                                // add sponsor name and logo
                                // check code existe,ce from code partner collection
                                var nameSponsor = null;
                                var LogoSponsor = null;
                                // send email
                                var mailOptions = { from: EMAIL_NO_REPLAY, 
                                    to: user.Email, 
                                    subject: APP_NAME + ': Confirmation d\'enregistrement de code', 
                                    text: 'Bonjour,\n\n' + 
                                        'Nous vous confirmons l\'enregistrement du code: ' + doc.Value + '.\n' +
                                        'Cet enregistrement concerne l\'objet suivant: \n' +
                                        '  - Type: ' + getObjectType(doc.Type) + '.\n' +
                                        getObjectComment(doc.Description, '.\n') + 
                                        '  - Email associé à cet objet: ' + user.Email + '.\n'  +
                                        '\n' + EMAIL_FOOTER,
                                };

                                db.partnercodes.findOne({ $and: [ { Startcode: { $lte: parseInt(codeValue) } }, { Endcode: { $gte: parseInt(codeValue) } } ] }, function(err, docp){
                                    if (err) {
                                        console.log("postCode codepartner find error");
                                        console.error(err);
                                        //return res.status(err.statusCode).json({ msg: err.message });
                                    }
                                    if (docp != null)
                                    {
                                        nameSponsor = 'Ce service vous est offert par <strong>' + docp.Name + '</strong>.\n';
                                        LogoSponsor = docp.Logo;
                                        console.log("postCode codepartner found " + nameSponsor
                                            + " logo " + LogoSponsor);
                                        console.log("postCode codepartner LogoSponsor and nameSponsor " + nameSponsor);
                                        mailOptions = { from: EMAIL_NO_REPLAY, 
                                            to: user.Email, 
                                            subject: APP_NAME + ': Confirmation d\'enregistrement de code', 
                                            html: '<p>Bonjour,<br>' + 
                                                'Nous vous confirmons l\'enregistrement du code: ' + doc.Value + '.<br>' +
                                                'Cet enregistrement concerne l\'objet suivant: <br>' +
                                                '  - Type: ' + getObjectType(doc.Type) + '.<br>' +
                                                getObjectComment(doc.Description, '.<br>') + 
                                                '  - Email associé à cet objet: ' + user.Email + '.<br>'  +
                                                '<img src="cid:LogoCodePartner"/><br>'
                                                + nameSponsor + '</p>' + EMAIL_FOOTER_HTM,
                                            attachments: [{
                                                    filename: LogoSponsor,
                                                    path: 'http://' + req.headers.host + '/img/' + LogoSponsor,
                                                    cid: 'LogoCodePartner' //same cid value as in the html img src
                                                }]
                                        };
                                        
                                    }
                                    else
                                    {
                                        console.log("postCode codepartner not found");
                                    }
                                    
                                    //'Ce service vous est offert par ' + doc.meceneName + '.\n' };
                                    transporter.sendMail(mailOptions, function (err) {
                                        if (err) { 
                                            console.log("postCode error sending confirmation email " + err.message);
                                            
                                            console.log("postCode remove code  " + codeValue);
                                            db.codes.remove({Value: codeValue});
                                            return res.status(500).send({ msg: err.message });  
                                        }
                                        console.log("postCode email sent");
                                        
                                        // manage usercreated
                                        if (userautocreated)
                                        {
                                            console.log("postCode user has been auto created");
                                            res.status(201).json(doc);
                                        }
                                        else
                                        {
                                            res.json(doc);
                                        }
                                        
                                    });
                                    
                                });

                            } 
                            else
                            {
                                console.log("postCode Internal error ");
                                res.status(500).json({ msg: "Internal error" });
                            }
                        });
                    }
                    else
                    {
                        // limit has been reached
                        res.status(402).json({ msg: "Impossible d'enregistrer ce code car vous avez atteint la limite du nombre de codes par utilisateur!" });
                    }
                }
            })
        
        }, function onError(errcode, errmsg){
            console.log("postCode checkCodePermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });
    }, function onErrorUser(errcode, errmsg){
        console.log("postCode checkUserPermission failed ret status: " + errcode);
        res.status(errcode).json({ msg: errmsg });
    });
    
});

app.delete('/code/:id', function(req, res){
    var id = req.params.id;
    console.log("deleteCode the code " + id);
    
    if (id != null)
    {
        // check code permission first
        checkUserTokenPermission(req, function onSuccessUser(user){
            console.log("deleteCode user matched ");
            db.codes.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
                if (err) {
                    console.log("deleteCode remove error");
                    console.error(err);
                    return res.status(err.statusCode).json({ msg: err.message });
                } else if (doc) {
                    console.log("deleteCode success " + id);
                    // send email
                    var mailOptions = { from: EMAIL_NO_REPLAY, 
                        to: user.Email, 
                        subject: APP_NAME + ': Confirmation de suppression de code', 
                        text: 'Bonjour,\n\n' + 
                            'Nous vous confirmons la suppression du code: ' + doc.Value + '.\n' + EMAIL_FOOTER};
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) { 
                            console.log("deleteCode error sending confirmation email ");
                            return res.status(500).send({ msg: err.message }); 
                        }
                        console.log("deleteCode email sent to " + user.Email);
                        res.json(doc);
                    });
                } 
                else
                {
                    console.log("deleteCode Internal error ");
                    res.status(500).json({ msg: "Internal error" });
                }
            });
        }, function onErrorUser(errcode, errmsg){
            console.log("deleteCode checkUserTokenPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });  
    }
    else
    {
        console.log("deleteCode invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
    
});

app.get('/codepartner/:id', function(req, res){
    var codeValue = req.params.id;
    console.log("getCodePartner the code value " + codeValue);
    if (codeValue != null)
    {
        // check code existe,ce from code partner collection
        db.partnercodes.findOne({ $and: [ { Startcode: { $lte: parseInt(codeValue) } }, { Endcode: { $gte: parseInt(codeValue) } } ] }, function(err, doc){
            if (err) {
                console.log("getCodePartner find error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            }
            if (doc != null)
            {
                console.log("getCodePartner code found");
                //res.download('/private/' + doc.Logo);
                res.json(doc);
            }
            else
            {
                console.log("getCodePartner code not found");
                return res.status(404).json({ msg: "Ce code est invalide!" });
            }
            
        });
    }
    else
    {
        console.log("getCodePartner invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }    
});

app.get('/codepartner/downloadlogo/:id', function(req, res){
    var id = req.params.id;
    console.log("codepartner_downloadlogo for id " + id);
    if (id != null)
    {

        // check code existe,ce from code partner collection
        db.partnercodes.findOne({_id: mongojs.ObjectId(id)}, function(err, doc){
            if (err) {
                console.log("codepartner_downloadlogo find error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            }
            if (doc != null)
            {
                console.log("codepartner_downloadlogo code found");
                // check code existe,ce from code partner collection
                res.sendFile('private/img/' + doc.Logo, {"root": __dirname}, function (err) {
                if (err) {
                        console.log("codepartner_downloadlogo error sendfile logo " + doc.Logo);
                        //res.status(500).json({ msg: "Download Logo erreur" });
                    } else {
                      console.log('codepartner_downloadlogo Sent:', doc.Logo);
                    }
                });
            }
            else
            {
                console.log("codepartner_downloadlogo code not found");
                return res.status(404).json({ msg: "Ce code est invalide!" });
            }
            
        });
        
    }
    else
    {
        console.log("codepartner_downloadlogo invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }    
});


app.get('/code/:id', function(req, res){
    var id = req.params.id;
    if (id != null)
    {
        console.log("getCode the code " + id);
        // check code permission first
        checkUserTokenPermission(req, function onSuccessUser(user){
            db.codes.findOne({_id: mongojs.ObjectId(id)}, function(err, docs){
                if (err) {
                    console.log("getCode find error");
                    console.error(err);
                    return res.status(err.statusCode).json({ msg: err.message });
                }
                res.json(docs);
            })
        }, function onErrorUser(errcode, errmsg){
            console.log("getCode checkUserTokenPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });
    }
    else
    {
        console.log("getCode invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }    
});


app.put('/code/:id', function(req, res){
    var id = req.params.id;
    if (id != null)
    {
        console.log("updateCode the code " + req.body.FistName);
        // check code permission first
        checkUserTokenPermission(req, function onSuccessUser(user){
            db.codes.findAndModify({query :{_id: mongojs.ObjectId(id)},
                update: {$set: {Value: req.body.Value, Type: req.body.Type, 
                    Description: req.body.Description, 
                    UserId: req.body.UserId,
                    DateUpdated: new Date()}}, 
                new: true},  function(err, docs){
                    if (err) {
                        console.log("updateCode find error");
                        console.error(err);
                        return res.status(err.statusCode).json({ msg: err.message });
                    }
                    res.json(docs);
                });
        }, function onErrorUser(errcode, errmsg){
            console.log("updateCode checkUserTokenPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });
    }
    else
    {
        console.log("updateCode invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
    
});


// messages
app.get('/messages', function(req, res){
    console.log("received getMessages from controller");
    
    // check code permission first
    checkUserTokenPermission(req, function onSuccessUser(user){
        console.log("getMessages user matched ");
        var user_email = user.Email;
        user_email.toLowerCase();

        db.messages.find({To: user_email}, function(err, docs){
            if (err) {
                console.log("getMessages remove error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (docs) {
                console.log("getMessages success " + docs);
                res.json(docs);
            } 
            else
            {
                console.log("getMessages Internal error ");
                res.status(500).json({ msg: "Internal error" });
            }
        })
    }, function onErrorUser(errcode, errmsg){
        console.log("getMessages checkUserTokenPermission failed ret status: " + errcode);
        res.status(errcode).json({ msg: errmsg });
    });
});

function sendMessage(doc, res)
{
    console.log("sendMessage to " + doc.To);
    // send email to the proprio!
    var mailOptions = { from: EMAIL_NO_REPLAY, 
        to: doc.To,
        //cc:  doc.From, // copy to the person who raises the alert
        subject: APP_NAME + ':' + doc.Subject, 
        text: doc.Text };
            //'Ce service vous est offert par ' + doc.meceneName + '.\n' };
    transporter.sendMail(mailOptions, function (err) {
        if (err) { 
            console.log("sendMessage error sending confirmation email ");
            return res.status(500).send({ msg: err.message }); 
        }
        console.log("sendMessage email sent");
        res.json(doc);
    });
}

app.post('/message', function(req, res){
    console.log("postMessage message  " + req.body.Value);

    // check code permission first
    console.log("postMessage user matched ");
    var msg = req.body;
    console.log("postMessage checkCodePermission msg.CodeValue " + msg.CodeValue);
    checkCodePermission(msg.CodeValue,  false, function onSuccessCode(code){
        console.log("postMessage checkCodePermission code found success ");
        // the code exist, that's good

        console.log("postMessage findOne user " + code.UserId);
    
        // now find the proprio!
        db.users.findOne({_id: mongojs.ObjectId(code.UserId)}, function(err, user){
            if (err) {
                console.log("postMessage finduser error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (user) {
                console.log("postMessage finduser successfull");
                // insert the message
                msg.To = user.Email;
                if (VERIF_MESSAGE_EMAIL)
                {
                    msg.Status = 0;
                }
                else
                {
                    msg.Status = 1;
                }

                if (msg.Subject == null || msg.Subject == "")
                {
                    // set subject by default
                    msg.Subject = "Signalement: votre object a été retrouvé!";
                }
                // add text
                var msgText = 'Bonjour,\n\n' + 
                    'Une personne a remonté un signalement à propos d\'un objet vous appartenant:\n' +
                    'Cela concerne l\'article suivant: \n\n' +
                    'Code de l\'objet : ' + code.Value + '.\n' +
                    'Type d\'objet : ' + getObjectType(code.Type) + '.\n' +
                    msg.Text + '.\n\n' + 
                    'Vous pouvez prendre contact directement avec la personne qui a remonté le signalement.\n'  +
                    'Son email est le suivant: ' + msg.From + '\n' +
                    'Son numéro de téléphone est le suivant: ' + msg.FromMobile + '\n' +
                    '.\n' + 
                    'Ce service vous est offert par NomDuSponsort' + '.\n';
                msg.Text = msgText;
                var dt = new Date();
                msg.DateCreated = dt;
                msg.DateUpdated = dt;
                    
                db.messages.insert(msg, function(err, doc){
                    if (err) {
                        console.log("postMessage insert error");
                        console.error(err);
                        return res.status(err.statusCode).json({ msg: err.message });
                    } else if (doc) {
                        console.log("postMessage success " + doc);
                        // send token pour vérifier l'adresse email 
                        if (VERIF_MESSAGE_EMAIL)
                        {
                            //console.log("postMessage VERIF_MESSAGE_EMAIL TODO later");

                            db.tokens.insert({ ObjectId: doc._id, token: crypto.randomBytes(16).toString('hex'), CreationDate: dt }, function(err, token) {
                                if (err) { 
                                    console.log("postMessage create token for verification error ");
                                    return res.status(500).send({ msg: err.message }); 
                                }
                     
                                // Send the email
                                console.log("postMessage link " + req.headers.host + '\/message_confirmation.html?token="' + token.token + '"');
                                
                                //var mailOptions = { from: 'no-reply@yourwebapplication.com', to: user.email, 
                                // subject: 'Account Verification Token', text: 'Hello,\n\n' + 
                                // 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
                                var mailOptions = { from: EMAIL_NO_REPLAY, 
                                    to: msg.From, 
                                    subject: APP_NAME + ': Jeton de vérification de votre signalement', 
                                    text: 'Bonjour,\n\n' + 'Vous avez fait une opération de signalement.\nPour que celui-ci soit notifié au propriétaire de l\'objet, merci de confirmer l\'opération en cliquant sur le lien: \nhttp:\/\/' + req.headers.host + '\/message_confirmation.html?token=' + token.token + '\n' + EMAIL_FOOTER};
                                transporter.sendMail(mailOptions, function (err) {
                                    if (err) { 
                                        console.log("postMessage error sending confirmation email ");
                                        return res.status(500).send({ msg: err.message }); 
                                    }
                                    console.log("postMessage link " + req.headers.host + '\/message_confirmation\/' + token.token);
                                    res.json(doc);
                                });
                                
                            }); 
                        }
                        else
                        {
                            sendMessage(doc, res);
                        }
                    } 
                    else
                    {
                        console.log("postMessage Internal error ");
                        res.status(500).json({ msg: "Internal error" });
                    }
                });
            }
            else
            {
                console.log("postMessage Internal error ");
                res.status(500).json({ msg: "Internal error" });
            }
        });
    }, function onError(errcode, errmsg){
        console.log("postMessage checkCodePermission failed ret status: " + errcode);
        res.status(errcode).json({ msg: errmsg });
    });
});


app.post('/message/confirmation/:id', function(req, res){
    console.log("messageConfirmation token:" + req.params.id);
    
    confirmToken(db.messages, req.params.id, res, function(docmsg){
        //res.json(doc);
        //get the message
        console.log("messageConfirmation findmsg: " + docmsg.ObjectId);
        if (docmsg) {
            console.log("messageConfirmation findmsg successfull code value : " + docmsg.CodeValue);
            sendMessage(docmsg, res);
        }
        else
        {
            console.log("messageConfirmation Internal error ");
            res.status(500).json({ msg: "Internal error" });
        }
        /*db.messages.findOne({_id: mongojs.ObjectId(doc.ObjectId)}, function(err, msg){
            if (err) {
                console.log("messageConfirmation findmsg error");
                console.error(err);
                return res.status(err.statusCode).json({ msg: err.message });
            } else if (msg) {
                console.log("messageConfirmation findmsg successfull code value : " + msg.CodeValue);
                
                sendMessage(msg, res);
            }
            else
            {
                console.log("messageConfirmation Internal error ");
                res.status(500).json({ msg: "Internal error" });
            }
        });*/
        
    });

});

app.delete('/message/:id', function(req, res){
    // check code permission first
    var id = req.params.id;
    if (id != null)
    {
        console.log("deleteMessage the message " + id);
        checkUserTokenPermission(req, function onSuccessUser(user){
            console.log("deleteMessage user matched ");
            db.messages.remove({_id: mongojs.ObjectId(id)}, function(err, doc){
                if (err) {
                    console.log("deleteMessage remove error");
                    console.error(err);
                    return res.status(err.statusCode).json({ msg: err.message });
                } 
                res.json(doc);
            })
        }, function onErrorUser(errcode, errmsg){
            console.log("deleteMessage checkUserTokenPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });
    }
    else
    {
        console.log("deleteMessage invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
    
});

app.get('/message/:id', function(req, res){
    var id = req.params.id;
    if (id != null)
    {
        console.log("getMessage the message " + id);
        // check code permission first
        checkUserTokenPermission(req, function onSuccessUser(user){
            db.messages.findOne({_id: mongojs.ObjectId(id)}, function(err, docs){
                if (err) {
                    console.log("getMessage find error");
                    console.error(err);
                    return res.status(err.statusCode).json({ msg: err.message });
                }
                res.json(docs);
            })
        }, function onErrorUser(errcode, errmsg){
            console.log("getMessage checkUserTokenPermission failed ret status: " + errcode);
            res.status(errcode).json({ msg: errmsg });
        });
    }
    else
    {
        console.log("getMessage invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
    
});


// attachment
app.get('/attachment', function(req, res){
    console.log("received get attachment from controller");
    db.attachments.find(function(err, docs){
        console.log(docs);
        res.json(docs); 
    });
    
});

app.post('/attachment', function(req, res){
    console.log(req.body);
    db.attachments.insert(req.body, function(err, docs){
        console.log(docs);
        res.json(docs); 
    });
    
});

app.delete('/attachment/:id', function(req, res){
    var id = req.params.id;
    if (id != null)
    {
        console.log("delete the attachment " + id);
        db.attachments.remove({_id: mongojs.ObjectId(id)}, function(err, docs){
            // delete the file attachment

            res.json(docs);
        })
    }
    else
    {
        console.log("delete attachment invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
});

app.get('/attachment/:id', function(req, res){
    var id = req.params.id;
    
    if (id != null)
    {
        console.log("retrieve the attachment " + id);
        db.attachments.findOne({_id: mongojs.ObjectId(id)}, function(err, docs){
            res.json(docs);
        })
    }
    else
    {
        console.log("delete attachment invalid data ");
        res.status(500).json({ msg: "Données invalides" });
    }
    
});


app.post('/mailcontact', function(req, res){
    var data = req.body;
    console.log("mailcontact " + data.contact_email);
    
    if (data.contact_email != null && data.contact_msg != null)
    {
        console.log("mailcontact check Permission onSuccessUser");
        // send the password by email
        var mailOptions = { from: EMAIL_NO_REPLAY, 
            to: 'hopalert.cie@gmail.com, nicolas.sabin35@gmail.com, jackie.paquet@orange.fr, contact@webcodex.fr', 
            // for testing to: 'hopalert.cie@gmail.com, nicolas.sabin35@gmail.com', 
            subject: APP_NAME + ': Demande de renseignements', 
            text: 'Bonjour,\n\n' + 
                    'Une personne désire avoir des renseignements sur ' + APP_NAME + '.\n' +
                    'Nom du contact: ' + data.contact_name + '.\n'  +
                    'Email du contact: ' + data.contact_email + '.\n' +
                    'Texte: ' + data.contact_msg + '.\n' + EMAIL_FOOTER};
               transporter.sendMail(mailOptions, function (err) {
            if (err) { 
                console.log("mailcontact error sending email ");
                return res.status(500).send({ msg: err.message }); 
            }
            console.log("mailcontact sendmail ok");
            res.status(200).json({ msg: "mail sent successfully"});
        });
    }
    else
    {
       console.log("mailcontact invalid email ");
       res.status(403).json({ msg: "Données invalides" });
    }
    
});

/*app.get('*', function(req, res){
    console.log("get route index ");
    res.sendFile(__dirname + "/public/index.html");
});*/

app.listen(SERVER_PORT);
console.log(APP_NAME + " server " + SERVER_VERSION);
console.log("running on port " + SERVER_PORT + "...");
console.log("email conf " + MLCONF);



