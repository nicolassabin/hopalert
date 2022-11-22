var app = angular.module('MyApp', []);

const AUTO_USER_CREATION = true; // to be changed later

var ALERT_TITLE = "WebCodex";
var ALERT_BUTTON_TEXT = "Ok";
var ALERT_BUTTON_YES = "Oui";
var ALERT_BUTTON_NO = "Non";

if(document.getElementById) {
    window.alert = function(txt) {
        swal({
          title: ALERT_TITLE,
          //icon: "success",
          text: txt,
          button: "OK",
        });
    }
}

function displayLoading(bDisplay) {
    if (bDisplay)
    {
        document.getElementById('actionButton').disabled = true;
        document.getElementById('loading').style.display = 'block';
    }
    else
    {
        document.getElementById('actionButton').disabled = false;
        document.getElementById('loading').style.display = 'none';
    }
}

function openNav() {
    document.getElementById("sideNavigation").style.width = "250px";
}
 
function closeNav() {
    document.getElementById("sideNavigation").style.width = "0";
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}

var getUserHeaders = function(user){
    var auth = btoa(unescape(encodeURIComponent("Basic " + user.Email+":"+ user.Password)));  
    var user_email = btoa(unescape(encodeURIComponent(user.Email)));  
    var user_password = btoa(unescape(encodeURIComponent(user.Password)));  
    
    return {'authorization' : auth, 'user_email' : user_email, 
        'user_password' : user_password};
};

var getTokenHeaders = function(token){
    var auth = btoa(unescape(encodeURIComponent("Basic " + token)));  
    var token = btoa(unescape(encodeURIComponent(token)));  
    
    return {'authorization' : auth, 'token' : token};
};

var checkPassword = function(event){
      if(password.value.length < 6 || password.value.length > 8) {
        password.setCustomValidity("Veuillez entrer un mot de passe de 6 et 8 caractères.");
      } else {
        password.setCustomValidity("");
      }
    }

var enableCredentialsValidation = function(){
    var form  = document.getElementsByTagName('form')[0];
    var email = document.getElementById('mail');
    var password = document.getElementById('password');
    var error = document.querySelector('.error');

    if (email != null)
    {
        email.addEventListener("keyup", function (event) {
          if(email.validity.typeMismatch) {
            email.setCustomValidity("Veuillez entrer un e-mail.");
          } else {
            email.setCustomValidity("");
          }
        });
    }

    if (password != null)
    {
    	password.addEventListener("keyup",checkPassword);
    	password.addEventListener("input", function (event) {
	      // Chaque fois que l'utilisateur saisit quelque chose
	      // on vérifie la validité du champ e-mail.
	      if (password.validity.valid) {
	        // S'il y a un message d'erreur affiché et que le champ
	        // est valide, on retire l'erreur
	        error.innerHTML = ""; // On réinitialise le contenu
	        error.className = "error"; // On réinitialise l'état visuel du message
	      }
	    }, false);
    }
    

    if (email != null)
    {
        email.addEventListener("input", function (event) {
          // Chaque fois que l'utilisateur saisit quelque chose
          // on vérifie la validité du champ e-mail.
          if (email.validity.valid) {
            // S'il y a un message d'erreur affiché et que le champ
            // est valide, on retire l'erreur
            error.innerHTML = ""; // On réinitialise le contenu
            error.className = "error"; // On réinitialise l'état visuel du message
          }
        }, false);
    }


    form.addEventListener("submit", function (event) {
      // Chaque fois que l'utilisateur tente d'envoyer les données
      // on vérifie que le champ email est valide.
      if (email!= null && !email.validity.valid) {
        
        // S'il est invalide, on affiche un message d'erreur personnalisé
        error.innerHTML = "Veuillez entrer une adresse e-mail correcte";
        error.className = "error active";
        // Et on empêche l'envoi des données du formulaire
        event.preventDefault();
      }

      if (password != null && !password.validity.valid) {
        
        // S'il est invalide, on affiche un message d'erreur personnalisé
        error.innerHTML = "Veuillez entrer un mot de passe";
        error.className = "error active";
        // Et on empêche l'envoi des données du formulaire
        event.preventDefault();
      }
    }, false);
}

var enableCredentialsValidationEx = function(){
    var form  = document.getElementsByTagName('form')[0];
    var password2 = document.getElementById('password2');
    
    enableCredentialsValidation();

	if (password2 != null)
	{
		password2.addEventListener("keyup", function (event) {
	      checkPassword(event);
	      if(password2.value.length > 0 && password2.value!=password.value) {
	        password2.setCustomValidity("Les mots de passe ne sont pas identiques!");
	      } else {
	        password2.setCustomValidity("");
	      }
	    });

	    password2.addEventListener("input", function (event) {
	      // Chaque fois que l'utilisateur saisit quelque chose
	      // on vérifie la validité du champ e-mail.
	      if (password2.validity.valid) {
	        // S'il y a un message d'erreur affiché et que le champ
	        // est valide, on retire l'erreur
	        error.innerHTML = ""; // On réinitialise le contenu
	        error.className = "error"; // On réinitialise l'état visuel du message
	      }
	    }, false);

	    form.addEventListener("submit", function (event) {
	      if (!password2.validity.valid) {
	        
	        // S'il est invalide, on affiche un message d'erreur personnalisé
	        error.innerHTML = "Les mots de passe ne sont pas identiques!";
	        error.className = "error active";
	        // Et on empêche l'envoi des données du formulaire
	        event.preventDefault();
	      }
	    }, false);
	}
    
}

var enableCodeFormValidation = function(){
    var form  = document.getElementsByTagName('form')[0];
    var codeValue = document.getElementById('codeValue');
    var error = document.querySelector('.error');

    enableCredentialsValidation();

    codeValue.addEventListener("keyup", function (event) {
      if(codeValue.value<1000000 || codeValue.value>9999999) {
        codeValue.setCustomValidity("Veuillez entrer un code de 7 chiffres.");
      } else {
        codeValue.setCustomValidity("");
      }
    });

    codeValue.addEventListener("input", function (event) {
      // Chaque fois que l'utilisateur saisit quelque chose
      // on vérifie la validité du champ.
      if (codeValue.validity.valid) {
        // S'il y a un message d'erreur affiché et que le champ
        // est valide, on retire l'erreur
        error.innerHTML = ""; // On réinitialise le contenu
        error.className = "error"; // On réinitialise l'état visuel du message
      }
    }, false);

    form.addEventListener("submit", function (event) {
      
      if (!codeValue.validity.valid) {
        
        // S'il est invalide, on affiche un message d'erreur personnalisé
        error.innerHTML = "Veuillez entrer un code correct";
        error.className = "error active";
        // Et on empêche l'envoi des données du formulaire
        event.preventDefault();
      }

    }, false);
}

app.controller('CodeCtrl', ['$scope', '$http','$sce',function CodeCtrl($scope, $http, $sce) {
   console.log("CodeCtrl controller is running");
 	

    enableCodeFormValidation();
    
    $scope.checkCode = function(){
        console.log("checkCode " + $scope.code.Value);
        // return if the code exist
    }

    $scope.getAttachmentCode = function(){
        console.log("getAttachmentCode " + $scope.code.Value);
        // parse the sponsorised code to retrieve the photo/video attahced to the code

    }

    $scope.uploadAttachment = function(){
        console.log($scope.attachment);
        
    }

    $scope.addCode = function(){
        console.log($scope.code);
        var email = document.getElementById('mail');
    	var password = document.getElementById('password');
    	var codeValue = document.getElementById('codeValue');


        if (codeValue.validity.valid && email.validity.valid && password.validity.valid){
            displayLoading(true);

            // set the type
            $scope.code.Type = $scope.codepartner.Type;
            $http.post('/code', $scope.code, {headers : getUserHeaders($scope.user)}).then(function(response) {
                displayLoading(false);
                console.log("addCode response: " + response);
                if (AUTO_USER_CREATION)
                {
                    if (response.status == 201)
                    {
                        alert("Les informations ont bien été enregistrées. Merci de valider la création de votre compte à partir de l'email que nous venons de vous envoyer.");
                    }
                    else
                    {
                        alert("Votre code a bien été enregistré, vous allez recevoir un email de confirmation");
                    }
                }
                else
                {
                    alert("Votre code a bien été enregistré, vous allez recevoir un email de confirmation");
                }
                //$scope.code = response.data;
                $scope.code = {};
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("addCode error: " + response.status);
                
                if (AUTO_USER_CREATION)
                {
                    //alert("Une erreur est survenue pendant l'opération"); 
                    //alert(response.data.msg); 
                    alert("Erreur: " + response.status + "\n" + response.data.msg); 
                }
                else
                {
                    if (response.status == 401)
                    {
                        swal({title: ALERT_TITLE,
                          text: "Identification incorrecte!\nSi vous n'avez pas encore de compte, désirez-vous en créer un maintenant?",
                          buttons: true,
                        })
                        .then((yesclicked) => {
                          if (yesclicked) {
                            console.log("addCode go to create account");
                            window.location.href = "/user_registration.html";
                          } 
                        });
                    } 
                    else
                    {
                       alert("Erreur: " + response.status + "\n" + response.data.msg); 
                       //alert("Une erreur est survenue pendant l'opération"); 
                    }   
                }
                
            });
        }
    }

   var getDisplayCodeType = function(type)
   {
        if (type == 1)
        {
            return "Porte-clés"; 
        }
        else {
            return "Objet";
        }
   }
   
   $scope.retrieveCodePartner = function(){
        console.log("retrieveCodePartner " + $scope.code);
        var codeValue = document.getElementById('codeValue');

        if (codeValue.validity.valid && $scope.code.Value != null){
            $http.get('/codepartner/' + $scope.code.Value, $scope.code).then(function(response) {
                $scope.codepartner = response.data;
                console.log("retrieveCodePartner successfull partner Name: " + $scope.codepartner.Name);
                $scope.CodePartnerLabel= $sce.trustAsHtml("<span><b>" + getDisplayCodeType($scope.codepartner.Type) + "</b></span> offert par <span><b>" + $scope.codepartner.Name + "</b></span>");
            
                //the response hold the url of the profile picutre..trying to download it
                $scope.CodePartnerLogo = "img/" + $scope.codepartner.Logo;
                document.getElementById('imgCodePartnerLogo').style.display = 'block';
                document.getElementById('labelCodePartnerLogo').style.display = 'block';
                /*$http.get('/codepartner/downloadlogo/'+$scope.codepartner.Logo).then(function(response) {
                    $scope.CodePartnerImg = "data:image/jpeg;base64,"+response.data;
                }, function errorCallback(response) {
                    console.log("retrieveCodePartner download logog error: " + response.status);
                    
                });*/
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log("retrieveCodePartner error: " + response.status);
                document.getElementById('imgCodePartnerLogo').style.display = 'none';
                document.getElementById('labelCodePartnerLogo').style.display = 'none';
                alert("Code invalide!"); 
                $scope.code = {};
            });
        }
        else
        {
            console.log("retrieveCodePartner invalid data");
            document.getElementById('labelCodePartnerLogo').style.display = 'none';
            document.getElementById('imgCodePartnerLogo').style.display = 'none';
        }
    }

}]);
       

app.controller('UserCtrl', ['$scope', '$http',function UserCtrl($scope, $http) {
  	console.log("UserCtrl controller is running");
	
    enableCredentialsValidationEx();
    
    $scope.addUser = function(){
        console.log($scope.user);
		var email = document.getElementById('mail');
    	var password = document.getElementById('password');
    	var password2 = document.getElementById('password2');
    
        // check values
        if (email.validity.valid && password.validity.valid && password2.validity.valid){
            displayLoading(true);
            $http.post('/user/register', $scope.user).then(function(response) {
                displayLoading(false);
                console.log("addUser response sucessfull");
                alert("Un email de verification a été envoyé à l\'adresse " + $scope.user.Email + ".");
                $scope.user = {};
                password2.value = '';
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("addUser error: " + response.status);
                //if (response.status == 403)
                //{
                alert("Erreur: " + response.status + "\n" + response.data.msg);
                //}
            });
        }
    }


    $scope.resendPassword = function(){
        console.log("resendPassword " + $scope.user.Email);
        var email = document.getElementById('mail');
    	
        if (email.validity.valid){
            displayLoading(true);
            $http.post('/user/resendPassword', $scope.user).then(function(response) {
                displayLoading(false);
                console.log("resendPassword response successfull");
                alert("Votre demande a bien été enregistrée, vous allez recevoir un email avec les instructions vous permettant de réinitialiser votre mot de passe.");
                $scope.user = response.data;
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("resendPassword error: " + response.status);
                alert("Une erreur est survenue pendant le traitement de cette opération!");
            });
        }
    }

    $scope.editUser = function(id){
        console.log("edit " + id);
        if (id != null)
        {
            displayLoading(true);
            $http.get('/user/' + id, $scope.user).then(function(response) {
                displayLoading(false);
                console.log(response);
                $scope.user = response.data;
            });
        }
        else{
            alert("Données invalides");
        }
        
    }


    $scope.updateUser = function(){
        console.log("update " + $scope.user._id);
        if ($scope.user._id != null)
        {
            document.getElementById('actionButtonSave').disabled = true;
            displayLoading(true);
            $http.put('/user/' + $scope.user._id, $scope.user).then(function(response) {
                displayLoading(false);
                console.log(response);
                $scope.user = response.data;
                swal({title: ALERT_TITLE,icon: "success",iconColor: '#ff6500',
                  text: "Votre modification ont bien été prises en compte.",
                  button: "OK",
                }).then((value) => {
                  document.getElementById('actionButtonSave').disabled = false;
                });
                
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                document.getElementById('actionButtonSave').disabled = false;
                console.log("updateUser error: " + response.status);
                alert("Une erreur s'est produite lors de l'enregistrement");
            });   
        }
        else{
            alert("Données invalides");
        }
        
        
    }

  
}]);


function confirmToken( http, urltoken, token, body, onClickOK)
{
    console.log("confirmToken " + token);

    // check values
    if (token){
        token = decodeURI(token);
        //token = token.substr(1).slice(0, -1);
        displayLoading(true);
        http.post(urltoken + token, body).then(function(response) {
            displayLoading(false);
            console.log("confirmToken response sucessfull");
            
            swal({title: ALERT_TITLE,/*icon: "success",*/
              text: "Bravo! l'opération a bien été validée",
              button: "OK",
            }).then((value) => {
              onClickOK();
            });
            
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            displayLoading(false);
            console.log("confirmToken error: " + response.status);
            if (response.status == 403 || response.status == 401)
            {
                alert(response.data.msg);
            }
            else
            {
               alert("Erreur: " + response.status + "\n" + response.data.msg); 
            }
        });
    }
    else
    {
        alert("Le lien est invalide!");
    }
}

app.controller('PswConfirmCtrl', ['$scope', '$http',function PswConfirmCtrl($scope, $http) {
    console.log("PswConfirmCtrl controller is running");
    
    enableCredentialsValidationEx();

    $scope.confirmPassword = function(){
        var token = getUrlParam("token", null);
        var password = document.getElementById('password');
        var password2 = document.getElementById('password2');
    
        // check values
        if (password.validity.valid && password2.validity.valid){
            confirmToken($http, 'user/confirmationPassword/', token, $scope.user, function() {
                console.log("confirmPassword ok");
                window.location.href = "/user.html";
            }); 
        }
        
    }
  
}]);

app.controller('UserConfirmCtrl', ['$scope', '$http',function UserConfirmCtrl($scope, $http) {
  	console.log("UserConfirmCtrl controller is running");
	
	var confirmRegister = function(){
        var token = getUrlParam("token", null);
        confirmToken($http, 'user/confirmation/', token, null, function() {
            console.log("confirmRegister ok");
            window.location.href = "/user.html";
        });
        
    }

    confirmRegister();

  
}]);

app.controller('MsgConfirmCtrl', ['$scope', '$http',function MsgConfirmCtrl($scope, $http) {
    console.log("MsgConfirmCtrl controller is running");
    

    var confirmMessage = function(){
        var token = getUrlParam("token", null);
        console.log("confirmMessage " + token);

        confirmToken($http, 'message/confirmation/', token, null, function() {
            console.log("confirmMessage ok");
            window.location.href = "/index.html";
        });
    }

    confirmMessage();
  
}]);

app.controller('MessageCtrl', ['$scope', '$http',function MessageCtrl($scope, $http) {
  console.log("MessageCtrl controller is running");

    var refresh = function(){
            displayLoading(true);
            $http.get('/messages').then(function(response) {
                displayLoading(false);
                console.log("response from the get");
                $scope.messages = response.data;
                $scope.message = {};
            }); 
    };

    //refresh();
    enableCodeFormValidation();
    

    $scope.addMessage = function(){
        console.log($scope.code);
        var email = document.getElementById('mail');
        var codeValue = document.getElementById('codeValue');
    
        if (codeValue.validity.valid && email.validity.valid){
            displayLoading(true);
            $scope.message.Subject='Signalement: votre object a été retrouvé!';
            $http.post('/message', $scope.message).then(function(response) {
                displayLoading(false);
                console.log("addMessage response: " + response);
                alert("Merci! Vous allez recevoir un email dans lequel vous devrez confirmer votre signalement pour que celui-ci soit notifié au propriétaire de l'objet.");
                //$scope.code = response.data;
                $scope.message = {};
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("', error: " + response.status);
                alert(response.data.msg); 
            });
        }
        else{
            alert("Données invalides");
        }
    }

    $scope.uploadAttachment = function(){
        console.log($scope.attachment);
        
    }

    $scope.removeMessage = function(id){
        console.log("remove " + id);
        displayLoading(true);
        $http.delete('/message/' + id).then(function(response) {
            console.log(response);
            displayLoading(false);
            refresh();
        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            displayLoading(false);
            console.log("', error: " + response.status);
            alert(response.data.msg); 
        });
    }

  
}]);

app.controller('ContactCtrl', ['$scope', '$http',function ContactCtrl($scope, $http) {
  console.log("ContactCtrl controller is running");

    enableCredentialsValidation();
    
    $scope.sendContactMessage = function(){
        console.log("sendContactMessage from " + $scope.contact_name);
        // Simple POST request example (passing data) :
        displayLoading(true);
        $http.post('/mailcontact', {contact_name: $scope.contact_name, contact_email: $scope.contact_email, contact_msg: $scope.contact_msg}).then(function(response) {
                displayLoading(false);
                console.log("sendContactMessage response: " + response);
                alert("Merci! votre demande a bien été prise en compte, et nous allons vous recontacter très prochainement.");
                //$scope.code = response.data;
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("', error: " + response.status);
                alert(response.data.msg); 
            });
    }

}]);

app.controller('UserMessagesCodeCtrl', ['$scope', '$http',function UserMessagesCodeCtrl($scope, $http) {
   console.log("UserMessagesCodeCtrl controller is running");

    //var token = getUrlParam("token", null);
    var token;

    var refreshCodes = function(){
            if (token != null)
            {
                displayLoading(true);
                $http.get('/codes',{headers : getTokenHeaders(token)}).then(function(response) {
                    displayLoading(false);
                    console.log("response from the refresh codes");
                    $scope.codes = response.data;
                    if ($scope.codes.length > 0)
                    {
                        document.getElementById('codesTable').style.display = 'block';
                    }
                    else
                    {
                        document.getElementById('codesTable').style.display = 'none';
                    }
                    $scope.code = {};
                }); 
            }
            else
            {
               console.log("refreshCodes invalid token");
            }
            
        
    };

    var displayLoadingEx = function(bDisplay) {
        document.getElementById('actionButtonSave').disabled = bDisplay;
        document.getElementById('actionButtonReinitPsw').disabled = bDisplay;
        displayLoading(bDisplay);
    }

    var refreshMessages = function(){
            if (token != null)
            {
                displayLoading(true);
                $http.get('/messages',{headers : getTokenHeaders(token)}).then(function(response) {
                    console.log("response from the message");
                    displayLoading(false);
                    $scope.messages = response.data;
                    if ($scope.messages.length > 0)
                    {
                        document.getElementById('messagesTable').style.display = 'block';
                    }
                    else
                    {
                        document.getElementById('messagesTable').style.display = 'none';
                    }
                    $scope.message = {};
                }); 
            }
            else
            {
               console.log("refreshMessages invalid token");
            }
            
        
    };

    enableCredentialsValidationEx();
    
    $scope.loginUser = function(){
        console.log("login " + $scope.user.Email);
        var email = document.getElementById('mail');
        var password = document.getElementById('password');
        
        if (email.validity.valid && password.validity.valid){
            displayLoading(true);
            $http.post('/user/login', $scope.user).then(function(response) {
                displayLoading(false);
                console.log("login response sucessfull");
                $scope.user = response.data;
                token = $scope.user._id;
                var userSpaceName = document.getElementById('userSpaceLabel');
                userSpaceName.innerHTML = userSpaceName.innerHTML + ": " + $scope.user.Email;
                document.getElementById('userLogin').style.display = 'none';
                document.getElementById('userSpace').style.display = 'block';
                $scope.editUserProfile($scope.user._id);

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log("login error: " + response.status);
                alert("Vos identifiants sont incorrects!"); 
            });
        }
    }

    $scope.logoutUser = function(){
        console.log("logout " + $scope.user.Email);
        document.getElementById('userLogin').style.display = 'block';
        document.getElementById('userSpace').style.display = 'none';
    }

    $scope.updateUser = function(){
        console.log("update " + $scope.user._id);
        if ($scope.user._id != null)
        {
            displayLoadingEx(true);
            $http.put('/user/' + $scope.user._id, $scope.user).then(function(response) {
                displayLoading(false);
                console.log(response);
                $scope.user = response.data;
                swal({title: ALERT_TITLE,/*icon: "success",*/
                  text: "Votre modification ont bien été prises en compte.",
                  button: "OK",
                }).then((value) => {
                    document.getElementById('actionButtonSave').disabled = false;
                    document.getElementById('actionButtonReinitPsw').disabled = false;
                });
                
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoadingEx(false);
                console.log("updateUser error: " + response.status);
                alert("Une erreur s'est produite lors de l'enregistrement");
            });   
        }
        else{
            alert("Données invalides");
        }
        
        
    }

    $scope.reinitUserPsw = function(){
        console.log("reinitUserPsw " + $scope.user._id);
        if ($scope.user._id != null)
        {
            displayLoadingEx(true);
            $http.post('/user/resendPassword', $scope.user).then(function(response) {
                displayLoadingEx(false);
                console.log("reinitUserPsw response successfull");
                alert("Votre demande a bien été enregistrée, vous allez recevoir un email avec les instructions vous permettant de réinitialiser votre mot de passe.");
                $scope.user = response.data;
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoadingEx(false);
                console.log("reinitUserPsw error: " + response.status);
                alert("Une erreur est survenue pendant le traitement de cette opération!");
            });
        }
        else{
            alert("Données invalides");
        }
        
        
    }

    $scope.removeUser = function(){
        console.log("removeUser " + $scope.user._id);
        if ($scope.user._id != null)
        {
            displayLoadingEx(true);
            $http.delete('/user/' + $scope.user._id, {headers : getUserHeaders($scope.user)}).then(function(response) {
                displayLoadingEx(false);
                console.log(response);
                swal({title: ALERT_TITLE,/*icon: "success",*/
                  text: "Le compte a bien été supprimé!",
                  button: "OK",
                }).then((value) => {
                  window.location.href = "/user.html";
                });

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoadingEx(false);
                console.log("removeUser error: " + response.status);
                alert("Impossible de supprimer le compte, veuillez réessayer!");
            });
        }
        else{
            alert("Données invalides");
        }
        
    }

    $scope.editUserProfile = function(id){
        console.log("editUserProfile " + id);
        document.getElementById('userProfile').style.display = 'block';
        document.getElementById('userCodes').style.display = 'none';
        document.getElementById('userMessages').style.display = 'none';
    }

    $scope.editUserCodes = function(id){
        console.log("editUserCodes " + id);
        document.getElementById('userCodes').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        document.getElementById('userMessages').style.display = 'none';
        refreshCodes();
        //window.location.href = "/user_codes.html?token=" + id;
    }

    $scope.editUserMessages = function(id){
        console.log("editUserMessages " + id);
        document.getElementById('userMessages').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        document.getElementById('userCodes').style.display = 'none';
        refreshMessages();
        //window.location.href = "/user_messages.html?token=" + id;
    }

    $scope.viewMessage = function(id){
        console.log("viewMessage " + id);
        //window.location.href = "/message_details.html?token=" + token + "&msgid=" + id;
        
        if (id != null && token != null)
        {
            displayLoading(true);
            $http.get('/message/' + id,{headers : getTokenHeaders(token)}).then(function(response) {
                console.log(response);
                displayLoading(false);
                var msg = response.data;
                if (msg != null)
                {
                    //var msgDetails = 'De: ' + msg.From + "\r\n\n" 
                    //+ ' Objet: ' + msg.Subject + "\n\n" 
                    //+ ' Texte: ' + msg.Text;
                    //alert(msg.Text);
                    swal({
                      title: 'De: ' + msg.From,
                      text: msg.Text,
                      button: "OK",
                    });
                }
                else
                {
                    alert("Erreur: les données sont invalides");
                }
            });
        }
        else
        {
           console.log("getMessage invalid data");
           alert("Erreur: les données sont invalides");
        }

    }

    $scope.removeCode = function(id){
        console.log("remove " + id);
        if (id != null && token != null)
        {
            displayLoading(true);
            $http.delete('/code/' + id,{headers : getTokenHeaders(token)}).then(function(response) {
                displayLoading(false);
                console.log(response);
                refreshCodes();
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                displayLoading(false);
                console.log(" error: " + response.status);
                alert(response.data.msg); 
            });
        }
        else
        {
           console.log("refresh invalid token");
           alert("Erreur: les données sont invalides");
        }

    }

    $scope.editCode = function(id){
        console.log("edit " + id);
        if (id != null && token != null)
        {
            displayLoading(true);
            $http.get('/code/' + id,{headers : getTokenHeaders(token)}).then(function(response) {
                displayLoading(false);
                console.log(response);
                $scope.code = response.data;
            });
        }
        else
        {
           console.log("refresh invalid token");
           alert("Erreur: les données sont invalides");
        }
        
    }

    $scope.updateCode = function(){
        console.log("update " + $scope.code._id);
        if ($scope.code._id != null && token != null)
        {
            displayLoading(true);
            $http.put('/code/' + $scope.code._id, $scope.code, {headers : getTokenHeaders(token)}).then(function(response) {
                displayLoading(false);
                console.log(response);
                $scope.code = {};
                refreshCodes();
            });
        }
        else
        {
           console.log("refresh invalid token");
           alert("Erreur: les données sont invalides");
        }
        
    }
    
    $scope.removeMessage = function(id){
        console.log("remove " + id);
        if (id != null && token != null)
        {
            displayLoading(true);
            $http.delete('/message/' + id,{headers : getTokenHeaders(token)}).then(function(response) {
                displayLoading(false);
                console.log(response);
                refreshMessages();
            });
        }
        else
        {
           console.log("refresh invalid token");
           alert("Erreur: les données sont invalides");
        }
    }
  
}]); 


app.controller('MessageViewDetailsCtrl', ['$scope', '$http',function MessageViewDetailsCtrl($scope, $http) {
   console.log("MessageViewDetailsCtrl controller is running");

    var msgid = getUrlParam("msgid", null);
    var token = getUrlParam("token", null);
    
    var getMessage = function(){
            if (msgid != null && token != null)
            {
                displayLoading(true);
                $http.get('/message/' + msgid,{headers : getTokenHeaders(token)}).then(function(response) {
                    displayLoading(false);
                    console.log(response);
                    $scope.message = response.data;
                });
            }
            else
            {
               console.log("getMessage invalid data");
            }
        
    };

    getMessage();

}]);   





