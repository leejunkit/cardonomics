function NavCtrl($route) {
	$route.when('/nav/logout', {template: 'partials/logout.html', controller: LogoutCtrl});
	$route.when('/nav/login', {template: 'partials/login.html', controller: LoginCtrl});
	$route.when('/nav/lobby', {template: 'partials/lobby.html', controller: UserStatus});
	$route.when('/nav/deckworkshop', {template: 'partials/deckworkshop.html', controller: UserStatus});
	$route.when('/nav/training', {template: 'partials/training.html', controller: UserStatus});
	$route.when('/nav/success', {template: 'partials/success.html', controller: UserStatus});
	$route.when('/nav/createmultiplayergame', {template: 'partials/createmultiplayergame.html', controller: UserStatus});
	$route.when('/nav/multiplayerlobby', {template: 'partials/multiplayerlobby.html', controller: UserStatus});
	$route.when('/nav/multiplayer', {template: 'partials/multiplayer.html', controller: UserStatus});
	$route.when('/nav/stats', {template: 'partials/stats.html', controller: UserStatus});
	$route.when('/nav/ref', {template: 'partials/referrals.html', controller: ReferralCtrl});
	$route.when('/nav/ref/:referralCode', {template: 'partials/referrals.html', controller: ReferralCtrl});
    $route.when('/nav/success/:cardId', {template: 'partials/success.html', controller: PurchaseCtrl});

	$route.when('/graph', {template: 'partials/graph.html'});
	$route.when('/nav/training/start', {template: 'partials/training2.html'});
	$route.when('/testing', {template: 'partials/testing.html'});


	$route.otherwise({redirectTo: '/nav/login'});
	$route.onChange(function(){this.params = $route.current.params;});
	$route.parent(this);
}

function MultiplayerCtrl($location,$cookieStore,Player_,Card_,MultiplayerGame_){
	var scope=this;
	scope.facebook_id = $cookieStore.get("fb_user_id");
    scope.facebook_name = $cookieStore.get("fb_username");
    console.log("items placed in cookie store "+scope.facebook_name+" "+scope.facebook_id);
	scope.chosenCards = [];
    scope.activeGames = null;

	scope.onload = function onload(){
        /**Convert Date time into elapsed time **/
        d = setTimeout("countElapsedTime()", 400);
        if (!scope.isATest) var fakeVar = new Date().toString();
        else fakeVar = null;
        this.activeGames=MultiplayerGame_.query({'user_id':scope.facebook_id,'accepted':'false', 'fakeVar': fakeVar}, function() {if(scope.activeGames.length>0){scope.showCounterChallengesClass = 'hide';}console.log("active games: "+scope.activeGames.length);countElapsedTime();});

        this.acceptedGames= MultiplayerGame_.query({'user_id':scope.facebook_id,'accepted':'true', 'fakeVar': fakeVar}, function() {if(scope.acceptedGames.length>0){scope.showCounterChallengesClass = 'show';}else{scope.blankChallengeMessage = 'show';}console.log("accepted games: "+scope.acceptedGames.length);});

        this.endedGames= MultiplayerGame_.query({'user_id':scope.facebook_id,'ended':'true', 'fakeVar': fakeVar}, function() {if(scope.endedGames.length>0){scope.endedGamesClass = 'show';}console.log("ended games: "+scope.endedGames.length);});

		var player = Player_.get({facebook_id: scope.facebook_id}, function() {cardList = player.cards_owned;cards=[];for(i=0;i<cardList.length;i++){var card = Card_.get({card_id: cardList[i]}, function() {});cards.push(card);}scope.cards = cards;});

	}

    countElapsedTime = function countElapsedTime() {
        for(var i=0;i<scope.activeGames.length;i++){
            //compare date time
            var startTime = new Date(scope.activeGames[i].date_created)
            var endTime = new Date();
            var timeDiff = endTime - startTime;
            timeDiff /= 1000;

            var seconds = Math.round(timeDiff % 60);
            timeDiff /= Math.round(60);
            var minutes = Math.round(timeDiff % 60);
            timeDiff /= Math.round(60);
            var hours = Math.round(timeDiff % 24);
            timeDiff /= Math.round(24);
            var days = timeDiff;

            if(Math.floor(days) != 0){
                scope.activeGames[i].time_elapsed = "Created "+Math.floor(days)+" days ago";
            }else if(Math.floor(hours) !=0 ){
                scope.activeGames[i].time_elapsed = "Created "+hours+" hours ago";
            }else if(Math.floor(minutes) !=0 ){
                scope.activeGames[i].time_elapsed = "Created "+minutes+" Mins ago";
            }else{
                scope.activeGames[i].time_elapsed = "Created "+seconds+" seconds ago";
            }


        }
    }

	//To reset the page and rechoose the cards
	scope.reset = function(){
        $(".modal-backdrop").hide();
	}
    scope.noOfCardsChosen = 0;
    scope.disabledClass = "disabled";
	scope.addCard = function addCard(card_id){

        //remove already chosen card if clicked again
        var index = scope.chosenCards.indexOf(card_id.toString());
        if(index!=-1){
            scope.chosenCards.splice(index,1);
            scope.noOfCardsChosen = scope.chosenCards.length;
            $("#"+card_id).removeClass("selected");
            if(scope.chosenCards.length < 3){
                scope.cardErrorClass = "";
                scope.infoMsg = "";
                scope.disabledClass = "disabled";
            }
            return;
        }

        if(scope.chosenCards.length==3){
            scope.cardErrorClass = "error-hl";
            scope.infoMsg = "  (Maximum reached!)";
            scope.disabledClass = "";
		}else if(scope.chosenCards.length<3){
            //check if card has already been selected
            if($.inArray(card_id.toString(), scope.chosenCards) == -1){
                scope.noOfCardsChosen = scope.chosenCards.length+1;
                scope.chosenCards.push(card_id.toString());
                console.log(scope.chosenCards);
                $("#"+card_id).addClass("selected");
            }
        }
        if(scope.chosenCards.length==3){
            scope.disabledClass = "";
        }
	}


	scope.addGame = function addGame(fb_id,facebook_name){
        if(scope.chosenCards.length==3){
			var game = new MultiplayerGame_();
			game.player_one_fb_id=fb_id.toString();
			game.player_one_cards=scope.chosenCards;
			game.game_status="active";
            game.player_one_name = facebook_name;
            if (!scope.isATest) game.date_created = (new Date()).toJSON(); //this can be parsed back into JS date object
			game.$save();
			//scope.chosenCards = chosenCards;
			scope.submitHideClass = "hide";
            window.location.hash=("#/nav/multiplayerlobby")
		}
	}

    scope.counterChallenge = function counterChallenge(game_id){
        scope.game_id=game_id;
        scope.counterButtonClass = "show";
        scope.chosen_game = MultiplayerGame_.get({id: scope.game_id}, function() {$cookieStore.put("game",scope.chosen_game);});
    }

    scope.startCounterChallenge = function startCounterChallenge(){
    	var game = MultiplayerGame_.get({id: scope.game_id}, function() {$cookieStore.put("game",game);$cookieStore.put("game_userid",game.player_one_fb_id);});
		window.location.hash="/nav/multiplayer";
		scope.add2playerHashChanged = true;
    }

	scope.chooseGame =function chooseGame(game_id){
		scope.game_id = game_id;
		scope.lobbyHideClass = 'hide';
	}

	scope.add2player = function add2player(){
		if(scope.chosenCards.length==3){
			var game = MultiplayerGame_.get({id: scope.game_id}, function() {game.player_two_fb_id=scope.facebook_id.toString();game.player_two_name=scope.facebook_name;console.log("name added: "+game.player_two_name);game.player_two_cards=scope.chosenCards;game.game_status="inprogress";game.$save();$cookieStore.put("game",game);$cookieStore.put("game_userid",game.player_one_fb_id);});
			window.location.hash="/nav/multiplayer";
			scope.add2playerHashChanged = true;
		}
	}
}

function BuildQuestionCtrl($cookieStore, ABBuildQuestion_,Card_,$xhr) {
	var scope = this;
	page_id = 0;
	scope.AB_BuildQn = function(){
        randomNum = Math.random();
		$("#startmsg").hide();
		if(randomNum <0.7){
			page_id=1;
			$("#wrapper1").slideDown("slow");
		}else{
			page_id=2;
			$("#wrapper2").slideDown("slow");
		}

		console.log("page_id: "+page_id);
		$.get('/api/ABTest/' + page_id).error(function() {
		   // the page does not exist
		   var page = new ABBuildQuestion_({page_id: page_id});
		   page.num_visits=1;
		   page.$save();
		   console.log('Page does not exist. created new page');

			})
			.success(function() {
			var page = ABBuildQuestion_.get({page_id: page_id}, function() {page.num_visits += 1;page.$save();console.log(page.num_visits);});
		});
	}

    scope.isSubmissionValid = function (){
        if (scope.q_name == ""||scope.q_text == ""||scope.level==null)
        {return false;}
        if(scope.selected == "mcq"){
            if(scope.correctAnswer == ""
                ||scope.wrongAnswer1 == ""
                ||scope.wrongAnswer2 == ""
                ||scope.wrongAnswer3 == "" )
            {return false;}
        }else{
            if(scope.supply == null || scope.demand == null)
            {return false;}
        }
        //if code made it here, it is valid
        return true;
    }

    scope.errorMsg = "";
    scope.errorClass = "hide";

    scope.submitQ = function submitQuestion(){

        if(scope.isSubmissionValid()){
            var answerList = new Array();
            answerList[0] = scope.correctAnswer;
            answerList[1] = scope.wrongAnswer1;
            answerList[2] = scope.wrongAnswer2;
            answerList[3] = scope.wrongAnswer3;

            var supply = scope.supply; //will be "left" or "right"
            var demand = scope.demand;
            var graphData = null;
            if(scope.selected=='graph'){
                graphData = scope.getCurveJSON(supply,demand);
            }

            //post to server
            var card = new Card_({
                level: parseInt(scope.level),
                topic: "Demand and Supply",
                question_name: scope.q_name,
                mcq_answers: answerList,
                graph_data: graphData,
                question_type: scope.selected,
                question_body: scope.q_text,
                creator: $cookieStore.get("fb_user_id")
            });
            console.log("page_id"+page_id);
			var page = ABBuildQuestion_.get({page_id: page_id}, function() {page.num_success += 1;page.$save();console.log(page.num_success);});
            card.$save(function(){scope.card_id = card.id;console.log('Card created! '+scope.card_id);window.location.hash = '/nav/success/'+card.id;});
        }else{
            console.log("invalid");
            scope.errorMsg = "Whoops, there was an error. Please check that all fields have been entered!";
            scope.errorClass = "show"; //unhide error div
        }
    }
    //eg; getCurveJSON('left','right')
    scope.getCurveJSON = function getCurveJSON(supply,demand){
        var supplyIdx = 0;
        var demandIdx = 0;

        if(supply=='left'){
            supplyIdx = -1;
        }else if(supply=='right'){
            supplyIdx = 1;
        }

        if(demand=='left'){
            demandIdx = -1;
        }else if(demand=='right'){
            demandIdx = 1;
        }
        var jsonReturn = '{"lines": [{"equation": "y-x",' +'"title": "Supply Curve","movable": true,' +'"points": {"min": [0,0],"max": [20,20]}},' +'{"equation": "y-x-20","title": "Demand Curve"' +',"movable": true,"points": {"min": [0,20],"max": [20,0]}}]' +',"axes": {"x": {"title": "Price","max": 20},"y": ' +'{"title": "Quantity","max": 20}},"solution": {"Demand Curve": ' +'{"deviation": '+demandIdx+'},"Supply Curve": {"deviation": '+supplyIdx+'}}}'
        return jsonReturn;
    }
}

function Training2Ctrl($location, $cookieStore, Player_, Card_, Grapher_, MCQEngine_, MultiplayerGame_) {

	var scope = this;
	scope.numCorrectAnswers = 0;
	scope.currentCardIndex = -1;

	facebook_id = $cookieStore.get("fb_user_id");
    facebook_name = $cookieStore.get("fb_username");
	scope.facebook_id=facebook_id;

    scope.hasAnsweredWrongly = false;
    scope.game = null; //init for multiplayer game

	//For training
	scope.startTraining = function startTraining(){
	   this.cards = Card_.query({'limit': 5, 'level': $cookieStore.get('requested_level'), 'topic': 'Demand and Supply'}, function() {scope.advanceNextCard();});
	   scope.trainingHasStarted = true;
    }

    scope.endMultiplayerGame = function endMultiplayerGame(){
        console.log("ending?");
        var game = MultiplayerGame_.get({id: scope.game.id}, function() {
            if(facebook_id==game.player_one_fb_id){
                game.player_one_time = scope.currentTimer;
            }else{
                game.player_two_time = scope.currentTimer;
            }
            game.$save();
            if(game.player_one_time > 0 && game.player_two_time > 0){
                game.game_status="ended";
                game.$save();
                var win_facebook_id = game.player_one_fb_id;
                var lose_facebook_id=game.player_two_fb_id;
                if(game.player_two_time < game.player_one_time){
                    lose_facebook_id = game.player_one_fb_id;
                    win_facebook_id=game.player_two_fb_id;
                }
                var playerWin = Player_.get({facebook_id: win_facebook_id}, function() {
                    playerWin.wins = playerWin.wins+1;
                    playerWin.$save();
                    console.log("wins incremented");
                });
                var playerLose = Player_.get({facebook_id: lose_facebook_id}, function() {
                    playerLose.losses = playerWin.losses+1;
                    playerLose.$save();
                    console.log("losses incremented");
                });
            }
            $cookieStore.remove("game");
        });
    }

	//For multiplayer only
	scope.startGame = function startGame(){
        scope.startTimer(0,false);
        scope.game = $cookieStore.get("game");
        if(scope.game == null){
            scope.returnToMultiplayerLobby();
        }

        console.log(scope.game);

		$("#challengefront").hide();
		$("#multiplayer-progress").slideDown("slow");
		if(scope.facebook_id!=$cookieStore.get("game_userid")){
			cList = scope.game.player_one_cards;
			console.log(scope.game);
			console.log(cList);
			//var cardList = cList[0]+','+cList[1]+','+cList[2];
 			// cards = []
			this.cards = Card_.query({'cList':cList}, function() {scope.advanceNextCard();});

			//scope.advanceNextCard();
		}else{
			cList = scope.game.player_two_cards;
			//var cardList = cList[0]+','+cList[1]+','+cList[2];
 			// cards = []
			this.cards = Card_.query({'cList':cList}, function() {scope.advanceNextCard();});
		}
	}
    scope.startTimer = function startTimer(duration,isDecrement){
        scope.currentTimer = 0;
        if(isDecrement){
            scope.timerID = setInterval("decrementTimer()",1000);
        }else{
            scope.timerID = setInterval("incrementTimer()",1000);
        }
    }
   /* decrementTimer=function(){
        if(scope.currentTimer>0){
            scope.currentTimer -= 1;
            $("#timerBox").text(scope.currentTimer + " seconds");
        }
    } */
    incrementTimer=function(){
        scope.currentTimer += 1;
        if(scope.currentTimer < 60){
            $("#timerBox").text(scope.currentTimer +" seconds");
        }else{
            $("#timerBox").text(Math.floor(scope.currentTimer/60) +" min " + scope.currentTimer%60 +" seconds");
        }
    }
    scope.stopTimer = function stopTimer(){clearInterval(scope.timerID);return scope.timerID;}
    scope.returnToLobby = function returnToLobby(){window.location.hash='/nav/lobby';$(".modal-backdrop").hide();}
    scope.returnToMultiplayerLobby = function returnToMultiplayerLobby(){window.location.hash='/nav/multiplayerlobby';$(".modal-backdrop").hide();}
    scope.returnToTraining = function returnToTraining(){window.location.hash='/nav/training';$(".modal-backdrop").hide();}

	scope.advanceNextCard = function advanceNextCard() {
        scope.hasAnsweredWrongly = false;
		if (scope.currentCardIndex == scope.cards.length - 1) {
            var timing = scope.stopTimer();
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
		}else if (scope.card.question_type == 'mcq') {
			scope.card.scrambled_mcq_answers = MCQEngine_.scrambleChoices(scope.card.mcq_answers.slice());
		}
		$(".massiveWrapper").fadeIn("medium");

	};

    scope.resetGraph = function resetGraph() {
      Grapher_.resetGraph(angular.fromJson(scope.card.graph_data, true), 20);
    };

	scope.playerHasAnsweredQuestion = function playerHasAnsweredQuestion(answer) {
		if (scope.card.question_type == 'graph') {
			Grapher_.checkAnswer(angular.fromJson(scope.card.graph_data),
				function correctAnswer() {
					scope.card.num_correct_attempts += 1;
					scope.card.$save();
					scope.numCorrectAnswers++;
					scope.advanceNextCard();
				}, function wrongAnswer() {
					scope.card.num_wrong_attempts += 1;
					scope.card.$save();
					alert("Try again! Hint is that only one bar should be moved!");
				}
			);
		}
		else if (scope.card.question_type == 'mcq') {

			MCQEngine_.checkAnswer(scope.card, answer, function correct() {
                if(!scope.hasAnsweredWrongly){
                    scope.numCorrectAnswers++;
                }
				scope.advanceNextCard();
			}, function wrong() {
				$(".wrong").slideDown("medium");
                scope.hasAnsweredWrongly=true;
			});
		}
	};

	scope.showScoreCard = function showScoreCard() {
		if (scope.numCorrectAnswers == scope.cards.length) {
			scope.perfectScore = "yes";
            scope.playerScorePercentage = Math.floor((scope.numCorrectAnswers/scope.cards.length)*100);
		}
		$('#scoreCard').modal('show');
		if(scope.game != null){
	        //set game to ended
	        scope.endMultiplayerGame();
		}
	};

	scope.addCardToPlayer = function addCardToPlayer(cardId) {
		var userId = $cookieStore.get('fb_user_id');
		var player = Player_.get({facebook_id: userId}, function() {player.addCard(cardId);window.location.hash = '/nav/success/'+cardId;$(".modal-backdrop").hide();});
	};

    scope.processPurchase = function processPurchase(card_id,card_name){
        //Check if card user already has this card
        var user_id = $cookieStore.get("fb_user_id");

        //increment purchase count for this card
        var card1 = Card_.get({card_id: parseInt(card_id)}, function() {
            console.log("owned before: "+card1.num_players_owned);
            card1.num_players_owned = card1.num_players_owned+1;
            card1.$save();
            console.log('after increment: '+card1.num_players_owned);

            //if this is a gold card, redirect to payment. else,
            //go to success directly
            if(card1.special_color!=null){
                var payload = "card_id="+card_id+"&card_name="+card_name+"&user_id="+user_id;
                //console.log("http://pehpalpayments.appspot.com?"+payload);
                window.location.replace("http://pehpalpayments.appspot.com?"+payload);
            }else{
                //console.log('/nav/success/'+card_id);
                $location.updateHash('/nav/success/'+card_id);
            }

        });
    }
}

function PurchaseCtrl($location,$route,Card_){
    var scope = this;
    scope.location = $location;
    scope.route = $route;

    scope.onLoad = function onLoad() {
	    if (scope.route.current.params['cardId']) {
	        var id = scope.route.current.params['cardId'];
	        scope.card = Card_.get({card_id: id}, function() {
                $("#card_bought").fadeIn("medium");
	        });
	    }
	    else {
	        scope.card=null;
	        scope.location.updateHash('/nav/lobby'); //else go back to lobby
	    }
    };



}

function ReferralCtrl($cookieStore, $location, $route, $xhr, Referral_) {
	var scope = this;

	scope.route = $route;
    scope.btnDisabledClass="disabled";
	//validation for email address
	scope.validateEmail=function(email){
		var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
		//console.log(pattern.test(email));
		if(pattern.test(email)){
            scope.errorClass = "success";
            scope.btnDisabledClass = "";
            scope.errorMessage = "Looks good, let's go!";
			scope.showThatUserHasEnteredSuccessfulEmail = true;
		}else{
            scope.errorClass = "warning";
            scope.btnDisabledClass = "disabled";
            scope.errorMessage = "";
			scope.showThatUserHasEnteredSuccessfulEmail = false;
		}
	}

	scope.pageLoad = function() {
		scope.submitButtonLabel = "Give me early access!";

	  if (scope.route.current.params['referralCode']) {
		//update the source referral count

		scope.sourceReferralCode = scope.route.current.params['referralCode'];

		$xhr('GET', '/api/referrals/' + scope.sourceReferralCode + '/increment', function() {
			console.log("Success: Increment source referral count.");
		  }, function(statusCode, response) {
			console.log("Error " + statusCode + ": Increment source referral count. " + response);
		  }
		);
	  }
	}

	scope.submitForm = function(email) {

		//validate email first
		var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
		//console.log(pattern.test(email));
		if (!pattern.test(email)) {
			//stop processing if email is wrong
			scope.errorClass = "error";
			scope.errorMessage = "Please enter a valid email address!";
			return;
		}

		scope.submitButtonLabel = "Please wait...";
		// user gives us his email address, we check if it's already there - if not we give him a referral code

		scope.jqXHRObject = $.ajax('/api/referrals', {
			'global': false,'data': {'email_address': scope.emailAddress},
			'success': function(data) {
				// this is an existing user
				//jstestdriver.console.log(data.a);
				//retrieve data from JSON

				if ((typeof data) == 'string') {
					var refObj = $.parseJSON(data);
				}

				else refObj = data;

				var conversionList = refObj.conversions_list;
				var numReferrals = refObj.num_referrals;
				var code = refObj.referral_code;
				var url = refObj.shortened_url;
				console.log("url: "+url)
				var emailAdd = refObj.email_address;

				/*   Manipulate DOM    */
				//hide input fields
				scope.hideClass = "hide";

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
				scope.ajaxResult = 'existingUser';

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
					scope.referralURL = newReferral.shortened_url;
					$("#fblink").attr("href", "https://www.facebook.com/sharer/sharer.php?u="+newReferral.shortened_url+"&t=Win+A+50GB+Dropbox+Account!+Cardonomics+the+best+way+to+learn+Economics");
					$("#twitterlink").attr("href", "https://twitter.com/share?url="+newReferral.shortened_url);

					//hide input fields
					scope.hideClass="hide";
					//use Jquery to show share link & focus input
					if ($("#share-links").is(":hidden")) {
						$("#share-links").slideDown("medium");
					}
					//$("#gen_reflink").focus();
					//$("#gen_reflink").select();
				});

				scope.ajaxResult = 'newUser';
				if (scope.sourceReferralCode) {
					jstestdriver.console.log('ma');
					//update the source referral's new conversion

					var postURL = '/api/referrals/' + scope.sourceReferralCode + '/increment';

					var success = function (statusCode, response) {
						console.log("Success: Update source referral conversion list.");
						scope.sourceReferralCodeUpdated = true;
					};

					var error = function (statusCode, response) {
						console.log("Error: Update source referral conversion list.");
					};

					$xhr('POST', postURL, 'new_email_address=' + scope.emailAddress, success, error);
				}
			}
		})
	}


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
					FB.getLoginStatus(function(response) {if (response.status == 'connected') {var uid = response.authResponse.userID;var accessToken = response.authResponse.accessToken;console.log('player is authenticated');$.get('/api/player/' + uid).error(function() {var player = new Player_({facebook_id: uid}); player.wins = 0;player.losses = 0;player.$save();console.log('player does not exist. created new player');}).success(function() {var player = Player_.get({facebook_id: uid}, function() {player.facebook_id = uid;player.$save();console.log('player updated in db');});});$cookieStore.put('fb_user_id', uid);$cookieStore.put('fb_username', username);window.location.hash = '/nav/lobby';}else{window.location.hash = '/nav/login';}
					});

				});
			}
		});
	};
}

function TestCtrl($cookieStore,$location){
	var scope = this;
	scope.buttonText = "Login with Facebook with Test user for localhost";
	scope.testNavigate = function(userid,username) {$cookieStore.put('fb_user_id', userid);$cookieStore.put('fb_username',username);console.log("id "+userid+" username: "+username);window.location.hash='/nav/lobby';$(".modal-backdrop").hide();scope.testNavigation = 'admin';};
}


function LogoutCtrl($cookieStore,$location){
	var scope = this;
	scope.startFBLogout = function() {window.location.hash = "/nav/login";FB.logout(function(response) {console.log(response);});};
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
			FB.getLoginStatus(function(response) {console.log('Verifying your information...');if (response.status =='connected') {var uid = response.authResponse.userID;var accessToken = response.authResponse.accessToken;scope.username = $cookieStore.get('fb_username');scope.userid = uid;}else{$cookieStore.remove('fb_username');$cookieStore.remove('fb_user_id');alert("you are being sent to Login Page");window.location.hash = '/nav/login';}});
		}
	};
}

/* This method provides a logged in user's details such as wins/losses/rank */
function UserDetails($cookieStore,Player_){
	var scope = this;
    scope.cookieStore = $cookieStore;
    scope.onLoad = function onLoad() {scope.userid = scope.cookieStore.get('fb_user_id');scope.username = scope.cookieStore.get('fb_username');var currPlayer = Player_.get({facebook_id: scope.userid}, function() {scope.user_wins = currPlayer.wins;scope.user_losses = currPlayer.losses;scope.evaluateRank();});}
    scope.evaluateRank = function evaluateRank() {if(scope.user_wins > 30){scope.user_rank = "Economics Wizard";}else if(scope.user_wins < 5){scope.user_rank = "Peasant";}else if(scope.user_wins <10){scope.user_rank = "Apprentice";}else if(scope.user_wins < 20){scope.user_rank = "Scholar";}else if(scope.user_wins < 30){scope.user_rank = "Economics Master";}console.log("player has- wins:"+scope.user_wins +"losses: "+scope.user_losses);};
}


function TrainingCtrl(Card_,$cookieStore,Player_){
	var scope = this;
	scope.buildDeckQNum = 0;    //default question id value.. Temporary
	scope.noOfQuestions;       //no of questions. Only init in startTraining()
	scope.arrayAnswers;       //array holding correct answer for each question

	//scope.currentLevel = 1;

	scope.startTraining = function startTraining() {
		$cookieStore.put('requested_level', scope.currentLevel);
		window.location.hash = '/nav/training/start';
        scope.trainingHasStarted = true;
	}

}

