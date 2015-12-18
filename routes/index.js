var express = require('express');
var router = express.Router();
var passport = require('passport');
var Account = require('../models/account');
var nodemailer = require('nodemailer');
var vars = require("../config/vars.json");
var stripe = require('stripe');
/* GET home page. */
router.get('/', function(req, res, next) {
	// console.log("This is the logged in user: "+req.user);
  res.render('index', { username: req.session.username });
});

//////////////////////////////////////////////
//////////////// REGISTER ////////////////////
//////////////////////////////////////////////

// Get the REGISTER page
router.get('/register',function(req,res,next){
	if(req.query.failedtoregister){
		res.render('register',{failed:"You must enter a password"});
	}else if(req.query.passwordsmustmatch){
		res.render('register',{nomatch:"Your passwords must match"});
	}

	res.render('register',{});
});

// Post to the REGISTER page
router.post('/register',function(req,res){
	console.log("////////////////////////////////////");
	console.log(req.body.password2);
	if(req.body.password != req.body.password2){
		return res.redirect('/register?passwordsmustmatch=1');
	}
	Account.register(new Account(
	{username:req.body.username}
	),
	req.body.password,
	function(err,account){
		if(err){
			return res.render('register?failedtoregister=1');// If error redirect back to register form
		}else{
			passport.authenticate('local')(req,res,function(){
				req.session.username = req.body.username;
				res.redirect('/choices');
			});
		}
	});
});

//////////////////////////////////////////
//////////////// LOGIN ///////////////////
//////////////////////////////////////////

router.get('/login',function(req,res,next){
	res.render('login');
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
       	   if(user.accessLevel == 5){
       	   	req.session.accessLevel = "Admin";
       	   }
           req.session.username = user.username;
           req.session.frequency = user.frequency;
           req.session.quarterPounds = user.quarterPounds;
           req.session.grind = user.grind;
           return res.redirect('/choices');
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

//////////////////////////////////////////
////////////// CANCEL ACCOUNT ////////////
//////////////////////////////////////////
router.get('/cancel',function(req, res){
	if(req.session.username){
		Account.findOneAndRemove({username:req.session.username},function(err){});
	}
	req.session.destroy();
	res.redirect('/');
})

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
		//Render the choices view
		res.render('choices',{username:req.session.username, grind:currGrind,frequency:currFrequency,quarterPounds:quarterPounds,accessLevel:req.session.accessLevel});
		});
		
	}else{
		res.redirect('/'); // Not logged in so redirect to home page
	}
})

router.post('/choices', function (req, res, next){
	// Is the user logged in
	if(req.session.username){
		Account.findOne({username:req.session.username});
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
		res.redirect('/delivery')
	}
});

//////////////////////////////////////////////
//////////////  DELIVERY /////////////////////
//////////////////////////////////////////////
router.get('/delivery',function(req,res,next){
	if(req.session.username){
		// They do belong here.  Proceed with the page
		// Check and see if they have any set preferences already.
		Account.findOne(
			{username:req.session.username},
			   function(err,doc){
				var newName= doc.name ? doc.name:"";//replaces an if statement.  If doc.grind is true set currGrind = doc. grind else set currGrind to undefined.
				var newAddress1 = doc.address1 ? doc.address1:"";
				var newAddress2 = doc.address2 ? doc.addres2:"";
				var newCity = doc.city ? doc.city:"";
				var newState = doc.state ? doc.state:"";
				var newZipCode = doc.zipcode ? doc.zipcode:"";
		//Render the choices view
		res.render('delivery',{username:req.session.username, name:newName,address1:newAddress1,address2:newAddress2,city:newCity,state:newState,zipcode:newZipCode});
		});
		
	}else{
		res.redirect('/'); // Not logged in so redirect to home page
	}
})

router.post('/delivery',function(req,res,next){
	// Is the user logged in
	if(req.session.username){
		var newName = req.body.name;
		var newAddress1 = req.body.address1;
		var newAddress2 = req.body.address2;
		var newCity = req.body.city;
		var newState = req.body.state;
		var newZipCode = req.body.zipcode;
		// console.log("The value of newPounds is:"+req.body.quarterPounds);
		Account.findOneAndUpdate(
			{username: req.session.username},
			{
			 name:newName,
			 address1:newAddress1,
			 address2:newAddress2,
			 city:newCity,
			 state:newState,
			 zipcode:newZipCode
			},
			{upsert: true},
			function (err,account){
				if(err){
					res.send('There was an error saving your shipping information.  Please re-enter or send this error to our help team');
				}else{
					account.save;
				}
			}
		)
	}
	res.redirect('payment');
})
///////////////////////////////////////
/////////// Payment //////////////////
//////////////////////////////////////

router.get('/payment',function(req, res, next){
	if(req.session.username){
		// They do belong here.  Proceed with the page
		// Check and see if they have any set preferences already.
		Account.findOne(
			{username:req.session.username},
			   function(err,doc){
			   	console.log("The value of doc is: "+doc);
				var newGrind= doc.grind ? doc.grind:"N/A";//replaces an if statement.  If doc.grind is true set currGrind = doc. grind else set currGrind to undefined.
				var newFrequency = doc.frequency ? doc.frequency:"N/A";
				var newQuarterPounds = doc.quarterPounds ? doc.quarterPounds:"N/A";
				var newName = doc.name ? doc.name:"N/A";
				var newAddress1 = doc.address1 ? doc.address1:"N/A";
				var newAddress2 = doc.address2 ? doc.address2:"N/A";
				var newCity = doc.city ? doc.city:"N/A";
				var newState = doc.state ? doc.state:"N/A";
				var newZipCode = doc.zipcode ? doc.zipcode:"N/A";
				var newOrderTotal = (doc.quarterPounds*19.99);
				newOrderTotal = newOrderTotal.toFixed(2);
				var newTotalWithShipping = (doc.quarterPounds*19.99)+7.99;
				newTotalWithShipping = newTotalWithShipping.toFixed(2);
				req.session.charge = newTotalWithShipping;
		//Render the choices view
		res.render('payment',{
							  username:req.session.username, 
							  name:newName,address1:newAddress1,
							  address2:newAddress2,
							  city:newCity,state:newState,
							  zipcode:newZipCode,
							  grind:newGrind,
							  frequency:newFrequency,
							  quarterPounds:newQuarterPounds,
							  orderTotal:newOrderTotal,
							  totalWithShipping:newTotalWithShipping,
							  key:vars.key

							});
		});
		
	}else{
		res.redirect('/'); // Not logged in so redirect to home page
	}
});

router.post('/payment',function(req,res,next){
	var stripe = require("stripe")(vars.privateKey);
	stripe.charges.create({
		amount:req.session.charge,
		currency:"usd",
		source:req.body.stripeToken,
		description:"Charge for "+req.body.stripeEmail
		},function(err,charge){
	})
	res.redirect('thankyou');
})

////////////////////////////////////
//////////// THANK YOU /////////////
////////////////////////////////////
router.get('/thankyou', function(req,res,next){
	res.render('thankyou',{username:req.session.username});
})
////////////////////////////////////
/////////// Accounts //////////////
///////////////////////////////////
router.get('/account',function(req, res, next){
	console.log("the value of req is: "+req);
	console.log("the valuse of res is: "+res);
	if(req.session.username){
		// They do belong here.  Proceed with the page
		// Check and see if they have any set preferences already.
		Account.findOne(
			{username:req.session.username},
			   function(err,doc){
			   	console.log("The value of doc is: "+doc);
				var newGrind= doc.grind ? doc.grind:"";//replaces an if statement.  If doc.grind is true set currGrind = doc. grind else set currGrind to undefined.
				var newFrequency = doc.frequency ? doc.frequency:"";
				var newQuarterPounds = doc.quarterPounds ? doc.quarterPounds:"";
				var newName = doc.name ? doc.name:"";
				var newAddress1 = doc.address1 ? doc.address1:"";
				var newAddress2 = doc.address2 ? doc.address2:"";
				var newCity = doc.city ? doc.city:"";
				var newState = doc.state ? doc.state:"";
				var newZipCode = doc.zipcode ? doc.zipcode:"";
		//Render the choices view
		res.render('account',{username:req.session.username, name:newName,address1:newAddress1,address2:newAddress2,city:newCity,state:newState,zipcode:newZipCode,grind:newGrind,frequency:newFrequency,quarterPounds:newQuarterPounds,key:vars.key});
		});
		
	}else{
		res.redirect('/'); // Not logged in so redirect to home page
	}
});
//////////////////////////////////
/////////// Email ////////////////
//////////////////////////////////

router.get('/email',function(req,res,next){
	var transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth:{
			user:vars.email,
			pass:vars.password
		}
	})
	var text = "This is a test email sent from my node server"
	var mailOptions = {
		from:'Stuart Tiedemann <tiedemannstuart@gmail.com>',
		to: 'Stuart Tiedemann <stuarttiedemann@yahoo.com',
		subject: 'This is a test subject',
		text: text
	}
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
			res.json({response:error});
		}else{
			console.log("Message was successfully sent. Response was "+info.response);
			res.json({response:"success"});
		}
	})
})

////////////////////////////////////////////
///////////////  CONTACT //////////////////
///////////////////////////////////////////

router.get('/contact',function(req,res,next){
	res.render('contact');
})
//////////////////////////////////////////
//////////////  ADMIN ////////////////////
//////////////////////////////////////////

router.get('/admin',function(req,res,next){
	if(req.session.accessLevel == "Admin"){
		Account.find(), function(err,doc,next){
			res.render('admin',{accounts:doc});
		};
	}else{
		res.redirect('/');
	}
})
module.exports = router;
