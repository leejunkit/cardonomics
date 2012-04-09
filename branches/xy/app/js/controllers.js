/* App Controllers */
/* CODING CONVENTION: Indentation should be 4 spaces yea? */

function NavCtrl($route) {
	var self = this;
	$route.when('/nav/logout', {template: 'partials/logout.html', controller: LogoutCtrl});
	$route.when('/nav/login', {template: 'partials/login.html', controller: LoginCtrl});
	$route.when('/nav/lobby', {template: 'partials/lobby.html', controller: UserStatus});
	$route.when('/nav/deckworkshop', {template: 'partials/deckworkshop.html', controller: UserStatus});
	$route.when('/nav/training', {template: 'partials/training.html', controller: UserStatus});
	$route.when('/nav/success', {template: 'partials/success.html', controller: UserStatus});
	$route.when('/nav/stats', {template: 'partials/stats.html', controller: UserStatus});
	$route.when('/nav/ref', {template: 'partials/referrals.html', controller: ReferralCtrl});
	$route.when('/nav/ref/:referralCode', {template: 'partials/referrals.html', controller: ReferralCtrl});

	$route.when('/graph', {template: 'partials/graph.html'});
	$route.when('/training/:topic/:level', {template: 'partials/training2.html'});
	$route.when('/testing', {template: 'partials/testing.html'});


	$route.otherwise({redirectTo: '/nav/login'});

	$route.onChange(function(){
		self.params = $route.current.params;
	});

	$route.parent(this);
}

function Training2Ctrl($cookieStore, Player_, Card_, Grapher_, MCQEngine_) {
	var scope = this;
	scope.numCorrectAnswers = 0;
	scope.cards = null;
	scope.currentCardIndex = -1;

	scope.advanceNextCard = function advanceNextCard() {

		if (scope.currentCardIndex == scope.cards.length - 1) {
			//player is finished with all his questions
			scope.showScoreCard();
			return;
		}

		$(".massiveWrapper").hide();
		$(".wrong").hide();

		//show progress on progress bar
		$("#training-progress").removeClass('hide');
		$("#trainingProgressBar .bar").css("width", ((scope.currentCardIndex + 1) / scope.cards.length) * 100 + "%");
		$("#progressNumber").text("Currently at " + (scope.currentCardIndex + 2) + " of " + scope.cards.length + " questions");

		scope.currentCardIndex++;
		scope.card = scope.cards[scope.currentCardIndex];

		if (scope.card.question_type == 'graph') {
			Grapher_.renderGraph(angular.fromJson(scope.card.graph_data, true), 20);
		}

		else if (scope.card.question_type == 'mcq') {
			scope.card.scrambled_mcq_answers = MCQEngine_.scrambleChoices(scope.card.mcq_answers.slice());
		}

		$(".massiveWrapper").fadeIn("medium");

	};

	scope.playerHasAnsweredQuestion = function playerHasAnsweredQuestion(answer) {
		if (scope.card.question_type == 'graph') {
			Grapher_.checkAnswer(angular.fromJson(scope.card.graph_data),
				function correctAnswer() {
					scope.numCorrectAnswers++;
					scope.advanceNextCard();
				}, function wrongAnswer() {
					alert("SUCK IT. TRY HARDER.");
				}
			);
		}

		else if (scope.card.question_type == 'mcq') {
			MCQEngine_.checkAnswer(scope.card, answer, function correct() {
				scope.numCorrectAnswers++;
				scope.advanceNextCard();
			}, function wrong() {
				$(".wrong").slideDown("medium");
			});

		}
	};

	scope.showScoreCard = function showScoreCard() {
		if (scope.numCorrectAnswers == scope.cards.length) {
			$("#scoreCardMessage").html("You did perfect! " +
					"<h4>Pick a card to add to your collection!</h4><br>" +
					"<span class='badge badge-success'> Limited Offer! </span>&nbsp;" +
					"As part of our beta special, you can 'buy' cards for free! " +
					"Simply enter any 18 digit number as a credit card. Have fun!&nbsp;&nbsp;&nbsp;&nbsp;" +
					"<span class='h6'>- The Cardonomics Team</span><br>");
			$("#cardChoice").removeClass("hide");
		}

		$('#scoreCard').modal('show');
	};

	scope.addCardToPlayer = function addCardToPlayer(cardId) {
		var userId = $cookieStore.get('fb_user_id');
		userId = '695341783';
		var player = Player_.get({facebook_id: userId}, function() {
			player.addCard(cardId);

			//redirect to success page
			window.location.hash = '/nav/success';
			window.location.reload();
		});
	};

	scope.revealPurchaseArea = function revealPurchaseArea(card_id,card_name){
		scope.chosen_card_id = card_id;
		scope.chosen_card_name = card_name;
		console.log("cardid: "+scope.chosen_card_id +" name: "+scope.chosen_card_name)
		if ($("#paymentArea").is(":hidden")) {
			$('#paymentArea').slideDown('medium');
		}
	};

	scope.validateForm = function(cardId){
		var isValid = false;
		//set rules
		$('#payment-form').validate({
			rules: {
				full_name: "required",
				credit_num: {required:true, digits:true, minlength:18},
				cvv: { required:true, digits:true}
			}
		});
		//validate form
		if($('#payment-form').validate().form()){
			//check further if month and date is properly filled
			if($('#month').val() != "MM" && $('#year').val() != "MM"){
				isValid=true;
			}
		}
		console.log(isValid);
		if(isValid){
			console.log("retrieving card id: "+cardId)
			//increment purchase count for this card
			var card1 = Card_.get({card_id: parseInt(cardId)}, function() {
				console.log("owned before: "+card1.num_players_owned);
				card1.num_players_owned = card1.num_players_owned+1;
				card1.$save();
				console.log('after increment: '+card1.num_players_owned);

				//add to player
				scope.addCardToPlayer(cardId);
			});

		}
	}

	this.cards = Card_.query(function() {
		scope.advanceNextCard();
	});
}

function RetrieveCardCtrl($location,$route,$cookieStore,Player_){
	var scope = this;
	scope.cardid=cardid;
	var cardid;
	scope.userid = $cookieStore.get('fb_user_id')
	console.log(scope.userid);
	var player = Player_.get({facebook_id: scope.userid}, function() {
				cardid = player.cards_owned;
				scope.cardid = cardid;
				console.log(cardid+' are added to player inventory');
	});


}
	

function PurchaseCtrl($location,$route,$cookieStore){
	var scope = this;
	scope.card_name = $cookieStore.get("card_name");
}

function ReferralCtrl($cookieStore, $location, $route, $xhr, Referral_) {
	var scope = this;
	//validation for email address
	scope.validateEmail=function(email){
		var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
		//console.log(pattern.test(email));
		if(pattern.test(email)){
			$('#refBtn').removeClass("disabled");
			$('#refforminput').removeClass("error");
			$('#refforminput').removeClass("warning");
			$('#refforminput').addClass("success");
			$('#msg').text("Looks good, let's go!");
		}else{
			$('#refBtn').addClass("disabled");
			$('#refforminput').removeClass("error");
			$('#refforminput').removeClass("success");
			$('#refforminput').addClass("warning");
			$('#msg').text("");
		}


	}

	scope.pageLoad = function() {
		scope.submitButtonLabel = "Give me early access!";

	  if ($route.current.params['referralCode']) {
		//update the source referral count

		scope.sourceReferralCode = $route.current.params['referralCode'];

		$xhr('GET', '/api/referrals/' + scope.sourceReferralCode + '/increment', function() {
			console.log("Success: Increment source referral count.");
		  }, function(statusCode, response) {
			console.log("Error " + statusCode + ": Increment source referral count. " + response);
		  }
		);
	  }

	  else {
		scope.sourceReferralCode = null;
	  }
	}

	scope.submitForm = function(email) {

		//validate email first
		var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
		//console.log(pattern.test(email));
		if (!pattern.test(email)) {
			//stop processing if email is wrong
			$('#refforminput').addClass("error");
			$('#msg').text("Please enter a valid email address!");
			return;
		}

		scope.submitButtonLabel = "Please wait...";
		// user gives us his email address, we check if it's already there - if not we give him a referral code

		$.ajax('/api/referrals', {
			'global': false,
			'data': {'email_address': scope.emailAddress},
			'success': function(data) {
				// this is an existing user
				console.log("existing user, code here should show him his stats.");
				//retrieve data from JSON
				var refObj = jQuery.parseJSON(data);
				var conversionList = refObj.conversions_list;
				var numReferrals = refObj.num_referrals;
				var code = refObj.referral_code;
				var url = refObj.shortened_url;
				console.log("url: "+url)
				var emailAdd = refObj.email_address;

				/*   Manipulate DOM    */
				//hide input fields
				$("#refinput").hide();

				//set share links
				//scope.referralURL = url;
				$("#fblink").attr("href", "https://www.facebook.com/sharer/sharer.php?u="+url+"&t=Win+A+50GB+Dropbox+Account!+Cardonomics+the+best+way+to+learn+Economics");
				$("#twitterlink").attr("href", "https://twitter.com/share?url="+url);
				$("#gen_reflink").val(url);

				//set info message
				var difference = 6 - numReferrals/2;
				var variableMsg = "Just refer "+difference+" more friends to us to enter the lucky draw!";
				if(difference == 6){variableMsg="Start sharing by using the links below.";}
				else if (difference<=0){variableMsg="We'll contact you via email when the lucky draw results are out!";}

				$(".comp-details").html("Welcome back. You've currently referred "+numReferrals/2+" friends to us." +
					"<br/>" + variableMsg);

				//show share links
				if ($("#share-links").is(":hidden")) {
					$("#share-links").slideDown("medium");
				}

				$("#gen_reflink").focus();
				$("#gen_reflink").select();
			},
			'error': function() {
				console.log("this is a new user");
				// this is a new user
				var newReferral = new Referral_();
				newReferral.email_address = scope.emailAddress;

				newReferral.$save(function () {
					
					//set button style
					scope.submitButtonLabel = "Done!";

					scope.showConfirmation = true;
					//scope.referralURL = newReferral.shortened_url;
					$("#fblink").attr("href", "https://www.facebook.com/sharer/sharer.php?u="+newReferral.shortened_url+"&t=Win+A+50GB+Dropbox+Account!+Cardonomics+the+best+way+to+learn+Economics");
					$("#twitterlink").attr("href", "https://twitter.com/share?url="+newReferral.shortened_url);
					$("#gen_reflink").val(newReferral.shortened_url);


					//hide input fields
					$("#refinput").hide();
					//use Jquery to show share link & focus input
					if ($("#share-links").is(":hidden")) {
						$("#share-links").slideDown("medium");
					}

					$("#gen_reflink").focus();
					$("#gen_reflink").select();
				});

				if (scope.sourceReferralCode) {
					//update the source referral's new conversion

					var postURL = '/api/referrals/' + scope.sourceReferralCode + '/increment';

					var success = function (statusCode, response) {
						console.log("Success: Update source referral conversion list.");
					};

					var error = function (statusCode, response) {
						console.log("Error: Update source referral conversion list.");
					};

					$xhr('POST', postURL, 'new_email_address=' + scope.emailAddress, success, error);
				}
			}
		})
	}

	scope.pageLoad();


	//function for encoding URI for share params
	scope.encodeShareParam = function(param){
		return encodeURIComponent(param);
	}

	//function for highlighting all text in textfield
	scope.selectall = function(){
		document.getElementById("gen_reflink").focus();
		document.getElementById("gen_reflink").select();
	}
}

function LoginCtrl(Player_,$cookieStore, $location) {
	var scope = this;

	scope.buttonText = "Login with Facebook";

	scope.startFBLogin = function() {
		scope.buttonText = "Please wait...";

		FB.login(function(response) {
		   if (response.authResponse) {
				console.log('Welcome! Fetching your information...');
				FB.api('/me', function(response) {
					var username = response.name;
					FB.getLoginStatus(function(response) {
						if (response.status === 'connected') {
							var uid = response.authResponse.userID;
							var accessToken = response.authResponse.accessToken;
							console.log('player is authenticated');

							$.get('/api/player/' + uid).error(function() {
							   // the player does not exist
							   var player = new Player_({facebook_id: uid});
							   player.wins = 0;
							   player.losses = 0;
							   player.$save();
							   console.log('player does not exist. created new player');

							})
							.success(function() {
								var player = Player_.get({facebook_id: uid}, function() {
									player.facebook_id = uid;
									player.$save();
									console.log('player updated in db');
								});                           
							});

							$cookieStore.put('fb_user_id', uid);
							$cookieStore.put('fb_username', username);

							
							window.location.hash = '/nav/lobby';
						}else{
							window.location.hash = '/nav/login';
						}
					});
					
				});
			}
		});
	};


}

function TestCtrl($cookieStore,$location){
	var scope = this;

	scope.buttonText = "Login with Facebook with Test user for localhost";

	scope.testNavigate = function() {
		$cookieStore.put('fb_user_id', 695341783);
		$cookieStore.put('fb_username','testuser');
		window.location.hash='/nav/lobby';
	};
}


function LogoutCtrl($cookieStore,$location){
	var scope = this;

	scope.startFBLogout = function() {

		//This redirect is to be removed once FB.logout works
		window.location.hash = "/nav/login";

		FB.logout(function(response) {
			console.log(response);
			// user is now logged out
		});
	};
}

//this prevents users from entering illegally without loggin in
function UserStatus($cookieStore, $location){
//get userid from FBLoginStatus object
	var scope = this;

	scope.startFBVerification = function() {
		if($cookieStore.get("fb_username"=='testuser')){
			scope.username = 'testuser';
			scope.userid = $cookieStore.get('fb_user_id');
		}else{
			FB.getLoginStatus(function(response) {
				console.log('Verifying your information...');
				if (response.status === 'connected') {
					var uid = response.authResponse.userID;
					var accessToken = response.authResponse.accessToken;
					scope.username = $cookieStore.get('fb_username');
					scope.userid = uid;
				}else{
					$cookieStore.remove('fb_username');
					$cookieStore.remove('fb_user_id');
					alert("you are being sent to Login Page");
					window.location.hash = '/nav/login';
				}
			});
		}
	};
}

/* This method provides a logged in user's details such as wins/losses/rank */
function UserDetails($cookieStore,Player_){
	var scope = this;
	//get logged in user details
	scope.userid = $cookieStore.get('fb_user_id');
	console.log('scope.userid is ' + scope.userid);
	scope.username = $cookieStore.get('fb_username');
	//get player from db
	var currPlayer = Player_.get({facebook_id: scope.userid}, function() {
		scope.user_wins = currPlayer.wins;
		scope.user_losses = currPlayer.losses;

		//evaluate rank
		if(scope.user_wins > 30){
			scope.user_rank = "Economics Wizard";
		}else if(scope.user_wins < 5){
			scope.user_rank = "Peasant";
		}else if(scope.user_wins <10){
			scope.user_rank = "Apprentice";
		}else if(scope.user_wins < 20){
			scope.user_rank = "Scholar";
		}else if(scope.user_wins < 30){
			scope.user_rank = "Economics Master";
		}
		console.log("player has- wins:"+scope.user_wins +"losses: "+scope.user_losses);
	});


}


function TrainingCtrl(Card_,$cookieStore,Player_){
	var scope = this;
	scope.buildDeckQNum = 0;    //default question id value.. Temporary
	scope.noOfQuestions;       //no of questions. Only init in startTraining()
	scope.arrayAnswers;       //array holding correct answer for each question

	//if player manages to get to choose a card, this will be initialise
	scope.chosen_card_id;
	scope.chosen_card_name;

	//array like 100 for 2 tries on question 1 or 1000 for 3 tries on qn 1
	//stored like  ['10','200','3000','4000','50'] for correct,wrng,wrng,wrng,correct
	scope.userCorrectAnswerArray = [];

	scope.currentLevel = 1;

	//default toggles
	//for now, toggle default values and ignore user input
	$("#l1").button('toggle');
	$("#nolimit").button('toggle');

	//default tab view
	$(document).ready(function(){
		//tab styles
		$("#tabOne").addClass("active");
		$("#tabTwo").removeClass("active");
		//show hide appropriate content
		$("#tabContentOne").addClass("active");
		$("#tabContentTwo").removeClass("active");
	});

	//Handler for tabs
	scope.tabClickHandler = function(tabNum){
		if(tabNum==1){
			//tab styles
			$("#tabOne").addClass("active");
			$("#tabTwo").removeClass("active");
			//show hide appropriate content
			$("#tabContentOne").addClass("active");
			$("#tabContentTwo").removeClass("active");
		}else if(tabNum==2){
			$("#tabTwo").addClass("active");
			$("#tabOne").removeClass("active");
			//show hide appropriate content
			$("#tabContentTwo").addClass("active");
			$("#tabContentOne").removeClass("active");
		}
	};

	//handles the level clicking
	scope.optionsHandler = function(clickedLevel) {
		$(['#l1', '#l2', '#l3']).each(function() {
		   $('' + this).removeClass('active'); 
		});

		$('#l' + clickedLevel).addClass('active');

		scope.currentLevel = clickedLevel;
	}

	scope.startTraining = function() {
		//hide last question, if any
		$("#q"+scope.buildDeckQNum).hide();
		//hide scorecard, if visible
		$('#scoreCard').modal('hide');

		//hide options fields
		$("#trainingOptions").hide();
		//set no of questions to show
		scope.noOfQuestions = 5 //5 as default

		//show loading screen
		$("#loadingQuestions").show();
		//$('#scoreCard').modal('show');
        console.log("curr lvl "+scope.currentLevel);
		scope.cards = Card_.query({'topic': 'Demand and Supply', 'level': scope.currentLevel, 'limit': 5}, function callback() {
			//remove loading and show training progress bar
			var t=setTimeout('$("#loadingQuestions").fadeOut("fast");$("#q1").fadeIn("medium");$("#training-progress").fadeIn("medium")',3000);

			//grab array of answers
			scope.arrayAnswers = [];
			for (var i = 0; i < scope.cards.length; i++) {
				//get first answer (the correct answer)
				scope.arrayAnswers[i] = scope.cards[i].mcq_answers[0];
				//init user answer array
				scope.userCorrectAnswerArray[i] = i+1;

				//HAHA we gonna print out the answer in the console for everyone to see ah
				//console.log("user ans array " + scope.userCorrectAnswerArray);
			}

			//shuffle answers
			for(var i=0;i<scope.cards.length;i++){
				var arrayAns = scope.cards[i].mcq_answers;
				scope.cards[i].mcq_answers = scope.shuffle(arrayAns);
				//console.log("just shuffled: "+scope.cards[i].mcq_answers);
			}

			//show next questions
			scope.nextQuestion();
		});
	}

	scope.restartTraining = function(){
		//hide last question
		$("#q"+scope.buildDeckQNum).hide();
		//reset relevant variables
		scope.buildDeckQNum = 0;
		for(var i=0;i<scope.cards.length;i++){
			//Re- init user answer array
			scope.userCorrectAnswerArray[i] = i+1;
			console.log("reset user ans array "+ scope.userCorrectAnswerArray);
		}
		//close modal
		$('#scoreCard').modal('hide');
		//show next question
		scope.nextQuestion();
	}

	scope.skipQuestion = function(){
		//register user's attempt at this question
		scope.userCorrectAnswerArray[scope.buildDeckQNum-1] += '0';
		scope.nextQuestion();
	}

	scope.shuffle = function(o){
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};

	scope.submitMcqAnswer = function(cardID) {

		//register user's attempt at this question
		scope.userCorrectAnswerArray[scope.buildDeckQNum-1] += '0';
		console.log("user ans array updated: "+ scope.userCorrectAnswerArray);

		//get user answer
		var receivedAnswer="";
		//iterate and locate checked radio button
		$("#q"+scope.buildDeckQNum+" input:radio").each(function(){
			if ($(this).attr('checked')){
				receivedAnswer = this.value;
				//receivedAnswer will be "Answer 1" for eg;
			}
		});

		//check if user has already answered wrongly
		var hasAnsweredWrongly = false;
		if(scope.userCorrectAnswerArray[scope.buildDeckQNum-1].length > 2){
			hasAnsweredWrongly=true;
		}

		//compare with actual answer
		if(scope.arrayAnswers[scope.buildDeckQNum-1]!=receivedAnswer){
			$(".wrong").slideDown("medium");
				//record user answering wrongly if this is first wrong attempt
			if(!hasAnsweredWrongly){
				var card = Card_.get({card_id: cardID}, function() {
					card.num_wrong_attempts = card.num_wrong_attempts+1;
					card.$save();
					console.log('wrong attempts incremented');
				});
			}
		}else{
			if(!hasAnsweredWrongly){ //if has not answered wrongly, increment correct attempts
				var card = Card_.get({card_id: cardID}, function() {
					card.num_correct_attempts = card.num_correct_attempts+1;
					card.$save();
					console.log('correct attempts incremented');
					//move to next question at end of callback
					scope.nextQuestion();
				});
			}else{  //else, just move on without incrementing
				scope.nextQuestion();
			}
		}
	}

	//hide wrong message function
	scope.hideErrorMessage= function(){
		$(".wrong").hide();
	}

	//question ids will be "q1", "q2" etc.
	//this function will use jquery to slide previous question out and slide new question in
	scope.nextQuestion = function(){
		//hide wrong message, if shown
		$(".wrong").hide();

		if($("#startButton").not(":hidden")){
			$("#startButton").hide();
		}
		//check if this is last question
		if(scope.buildDeckQNum == scope.noOfQuestions){
			//evaluate results
			scope.score = scope.evaluateScore(scope.userCorrectAnswerArray)+"/"+scope.noOfQuestions;
			scope.percentage = (scope.evaluateScore(scope.userCorrectAnswerArray)/scope.noOfQuestions)*100;
			//console.log("score is:"+scope.score+" ,perc: "+scope.percentage);
			//show results modal
			$('#scoreCard').modal('show');
			//inject card choice message if user gets all correct
			if(scope.percentage==100){
				$("#scoreCardMessage").html("You did perfect! " +
					"<h4>Pick a card to add to your collection!</h4><br>" +
					"<span class='badge badge-success'> Limited Offer! </span>&nbsp;" +
					"As part of our beta special, you can 'buy' cards for free! " +
					"Simply enter any 18 digit number as a credit card. Have fun!&nbsp;&nbsp;&nbsp;&nbsp;" +
					"<span class='h6'>- The Cardonomics Team</span><br>");
				$("#cardChoice").removeClass("hide");

			}
			console.log("finished!");
			return;
		}
		//slide prev question out
		$("#q"+scope.buildDeckQNum).hide();
		//console.log("sliding out"+scope.buildDeckQNum);
		//slide new qn in
		scope.buildDeckQNum += 1;
		$("#q"+scope.buildDeckQNum).fadeIn("medium");
		//console.log("sliding in"+scope.buildDeckQNum);

		//show progress on progress bar
		$("#trainingProgressBar .bar").css("width",scope.buildDeckQNum/scope.noOfQuestions*100+"%");
		//console.log("width is "+ scope.buildDeckQNum/scope.noOfQuestions*100+"%")
		//populate progress number (below progress bar)
		$("#progressNumber").text("Currently at "+scope.buildDeckQNum+" of "+scope.noOfQuestions+" questions")
	}

	scope.evaluateScore = function(arr){
		var score = 0;
		for(var i=0;i<arr.length;i++){
			if (arr[i].length==2){
				score++;
			}
		}
		return score;
	}
	//redirect from score card to lobby
	scope.redirectToLobby = function(){
		$('#scoreCard').modal('hide');
		window.location = "#/nav/lobby";
	}

	//this method is used to handle adding card to player (also for purchases)

		/** Method for validating purchase form **/
		scope.validateForm = function(card_id,card_name){
			var isValid = false;
			//set rules
			$('#payment-form').validate({
				rules: {
					full_name: "required",
					credit_num: {required:true, digits:true, minlength:18},
					cvv: { required:true, digits:true}
				}
			});
			//validate form
			if($('#payment-form').validate().form()){
				//check further if month and date is properly filled
				if($('#month').val() != "MM" && $('#year').val() != "MM"){
					isValid=true;
				}
			}
			console.log(isValid);
			if(isValid){
				console.log("retrieving card id: "+card_id)
				//increment purchase count for this card
				var card1 = Card_.get({card_id: parseInt(card_id)}, function() {
					console.log("owned before: "+card1.num_players_owned);
					card1.num_players_owned = card1.num_players_owned+1;
					card1.$save();
					console.log('after increment: '+card1.num_players_owned);

					//add to player
					scope.addCardToPlayer(card_id,card_name)
				});

			}
		}
		/** Slide in purchase area**/
		scope.revealPurchaseArea = function(card_id,card_name){
			scope.chosen_card_id = card_id;
			scope.chosen_card_name = card_name;
			console.log("cardid: "+scope.chosen_card_name+" name: "+scope.chosen_card_name)
			if ($("#paymentArea").is(":hidden")) {
				$('#paymentArea').slideDown('medium');
			}
		}

		/** This method will be called directly if not a purchase **/
		scope.addCardToPlayer = function(card_id,card_name){

			scope.userid = $cookieStore.get('fb_user_id');
			console.log("facebook userid is: "+scope.userid+", card details are: "+card_id+card_name);
			$cookieStore.put('card_id',card_id);
			$cookieStore.put('card_name',card_name);
			var player = Player_.get({facebook_id: scope.userid}, function() {
				//check if player already owns this card
				if($.inArray(card_id.toString(), player.cards_owned)== -1){
					player.cards_owned.push(card_id.toString()) ;
					console.log(player.cards_owned);
					player.$save();
					console.log('card added to player inventory');

				}else{
					console.log('player already has card');
				}

				//redirect to success page
				window.location.hash = '/nav/success';
				window.location.reload();
			});
		}



}
/*
function LobbyCtrl($cookieStore) {
  var scope = this;
  scope.username = $cookieStore.get('fb_username');
  scope.userid = $cookieStore.get('fb_user_id');

  
}

function DeckWorkshopCtrl($cookieStore) {
  alert("hello deck!");
  $cookieStore.put('user_id', 'haha123456');
  alert($cookieStore.get('user_id'));
}

function TrainingCtrl($cookieStore) {
  alert($cookieStore.get('user_id'));
}
*/

