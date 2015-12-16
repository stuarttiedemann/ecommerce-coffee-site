var express = require('express');
var router = express.Router();
var passport = require('passport');
var Account = require('../models/account');

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(req.user);
  res.render('index', { user: req.user });
});

//////////////////////////////////////////////
//////////////// REGISTER ////////////////////
//////////////////////////////////////////////

// Get the REGISTER page
router.get('/register',function(req,res){

	res.render('register',{});
});

// Post to the REGISTER page
router.post('/register',function(req,res){
	Account.register(new Account(
	{username:req.body.username}
	),
	req.body.password,
	function(err,account){
		if(err){
			return res.render('register');// If error redirect back to register form
		}else{
			passport.authenticate('local')(req,res,function(){
				req.session.username = req.body.username;
				res.redirect('/');
			})
		}
	});
});

//////////////////////////////////////////
//////////////// LOGIN ///////////////////
//////////////////////////////////////////
router.get('/login',function(req,res,next){
	res.render('login')
})


router.post('/login', function(req, res, next) {

     passport.authenticate('local', function(err, user, info) {
     	console.log("the user is:"+user);
       if (err) {
         return next(err); // will generate a 500 error
       }
       // Generate a JSON response reflecting authentication status
       if (! user) {
         return res.redirect('/login?failedlogin=1');
       }
       if (user){
           req.session.username = user.username;
           req.session.frequency = user.frequency;
           req.session.quarterPounds = user.quarterPounds;
           req.session.grind = user.grind;
           return res.render('choices', 
           	{
           		username: req.session.username,
           		frequency: user.frequency,
           		quarterPounds: user.quarterPounds,
           		grind: user.grind
           	});
       }

       
     })(req, res, next);

});

//////////////////////////////////////////
/////////////// LOGOUT ///////////////////
//////////////////////////////////////////


router.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

/////////////////////////////////////////
//////////////// CHOICES ////////////////

router.get('/choices', function(req,  res, next){
	// Make sure the user is logged in
	if(req.session.username){
		// They do belong here.  Proceed with the page
		// Check and see if they have any set preferences already.
		Account.findOne(
			{username:req.session.username},
			   function(err,doc){
				var currGrind = doc.grind ? doc.grind:undefined;//replaces an if statement.  If doc.grind is true set currGrind = doc. grind else set currGrind to undefined.
				var currFrequency = doc.frequency ? doc.frequency:undefined;
				var quarterPounds = doc.quarterPounds ? doc.quarterPounds:undefined;
		});
		//Render the choices view
		res.render('choices');
	}else{
		res.redirect('/'); // Not logged in so redirect to home page
	}
})

router.post('/choices', function (req, res, next){
	// Is the user logged in
	if(req.session.username){
		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newPounds = req.body.quarterPounds;
		// console.log("The value of newPounds is:"+req.body.quarterPounds);
		Account.findOneAndUpdate(
			{username: req.session.username},
			{
			 grind:newGrind,
			 frequency:newFrequency,
			 quarterPounds:newPounds
			},
			{upsert: true},
			function (err,account){
				if(err){
					res.send('There was an error saving your preferences.  Please re-enter or send this error to our help team');
				}else{
					account.save;
				}
			}
		)
		res.send("Welcome to the delivery page")
	}
});

//////////////////////////////////////////////
//////////////  DELIVERY /////////////////////
//////////////////////////////////////////////

router.post('/delivery',function(req,res,next){
	// Is the user logged in
	if(req.session.username){
		var newGrind = req.body.grind;
		var newFrequency = req.body.frequency;
		var newPounds = req.body.quarterPounds;
		// console.log("The value of newPounds is:"+req.body.quarterPounds);
		Account.findOneAndUpdate(
			{username: req.session.username},
			{
			 grind:newGrind,
			 frequency:newFrequency,
			 quarterPounds:newPounds
			},
			{upsert: true},
			function (err,account){
				if(err){
					res.send('There was an error saving your preferences.  Please re-enter or send this error to our help team');
				}else{
					account.save;
				}
			}
		)
	}
	res.render('index');
})
router.get('/delivery',function(req,res,next){
	res.render('delivery');
})



module.exports = router;
