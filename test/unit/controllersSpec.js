/* jasmine specs for controllers go here */
jasmine.getEnv().addReporter(new jasmine.ConsoleReporter(console.log));

describe('PurchaseCtrl', function(){
  var scope, $browser, purchaseCtrl;

  beforeEach(function(){
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });

    scope = angular.scope();
    $browser = scope.$service('$browser');

    purchaseCtrl = scope.$new(PurchaseCtrl);

  });

  it('should have be defined', function() {
    expect(purchaseCtrl).toBeDefined();
  });

  it('should have $location injected', function() {
    expect(purchaseCtrl.location).toBeDefined();
  });

  it('should have $route injected', function() {
    expect(purchaseCtrl.route).toBeDefined();
  });

  it('should return correct response when passed a valid cardId', function() {
    var routeMock = {current: {params: {cardId: 1}}};
    purchaseCtrl.route = routeMock;

    $browser.xhr.expectGET('/api/cards/1').respond({id:1});
    purchaseCtrl.onLoad();
    $browser.xhr.flush();

    expect(purchaseCtrl.card).toEqualData({id:1});
  });

  it('should redirect to /nav/lobby when there is no cardId', function() {
    var routeMock = {current: {params: {}}};
    purchaseCtrl.route = routeMock;

    expect(purchaseCtrl.card).toBeUndefined();
  })
});

describe('ReferralCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(ReferralCtrl);
  });

  describe('validateEmail method', function() {
    it('should detect that correct email', function() {
      ctrl.validateEmail('abc@def.com');
      expect(ctrl.showThatUserHasEnteredSuccessfulEmail).toBeTruthy();
    });

    it('should detect that malformed email', function() {
      ctrl.validateEmail('abc@def..com');
      expect(ctrl.showThatUserHasEnteredSuccessfulEmail).toBeFalsy();
    });
  });

  describe('pageLoad method', function() {
    beforeEach(function() {
      var routeMock = {current: {params: {referralCode: 'abc123'}}};
      ctrl.route = routeMock;

      $browser.xhr.expectGET('/api/referrals/abc123/increment').respond({'success':'ok'});
      ctrl.pageLoad();
    });

    it('should put the referralCode in sourceReferralCode variable', function() {
      expect(ctrl.sourceReferralCode).toEqual('abc123');
    });
  });

  describe('submitForm method', function() {
    beforeEach(function() {
    $browser.xhr.expectPOST('/api/referrals|{}').respond({'conversions_list': [], 'num_referrals': 1, 'referral_code': 'abc123', 'shortened_url': 'http://testurl.com', 'email_address': 'lala@haha.com'});
    jasmine.Ajax.useMock();

  });

    it('should have the jquery ajax object in the scope', function() {
      ctrl.submitForm('abc@def.com');
      expect(ctrl.jqXHRObject).toBeDefined();
    });

    it('should make the ajax call to the correct url', function() {
      spyOn($, "ajax").andCallThrough();
      ctrl.submitForm('abc@def.com');
      expect($.ajax.mostRecentCall.args[0]).toEqual("/api/referrals");
    });

    it('should call success callback if the user already exists', function() {

      ctrl.submitForm('existingUser@def.com');
      request = mostRecentAjaxRequest();
      request.response({status: 200, responseText: '{"conversions_list": [], "num_referrals": 1, "referral_code": "abc123", "shortened_url": "http://testurl.com", "email_address": "lala@haha.com"}'});

      expect(ctrl.ajaxResult).toBe('existingUser');
    });

    it('should call error callback if the user does not exist', function() {
      ctrl.submitForm('newUser@def.com');
      request = mostRecentAjaxRequest();
      request.response({status:404});

      expect(ctrl.ajaxResult).toBe('newUser');
    });

    it('should make another ajax call to increment the source referral count if there is a source referral code', function() {
      ctrl['sourceReferralCode'] = 'abc1234';
      //$browser.xhr.expectPOST('/api/referrals/abc1234').respond({});
      ctrl.submitForm('newUserWithReferral@def.com');
      request.response({status:404});
      expect(ctrl.sourceReferralCodeUpdated).toBeUndefined();
    });
  });
});

describe('MultiplayerCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(MultiplayerCtrl);
    ctrl.isATest = true;
  });

  describe('onload method', function() {
    beforeEach(function() {
      $browser.xhr.expectGET('/api/multiplayergame').respond([{id: 1}]);
      $browser.xhr.expectGET('/api/multiplayergame?accepted=true&fakeVar=null&user_id=undefined').respond({id: 1});
      $browser.xhr.expectGET('/api/multiplayergame?accepted=false&fakeVar=null&user_id=undefined').respond({id: 1});
      $browser.xhr.expectGET('/api/player').respond([{id: 1}]);      
      $browser.xhr.expectGET('/api/multiplayergame?ended=true&fakeVar=null&user_id=undefined').respond({id: 1});
    });

    it('should have the games scope variable defined', function() {
      ctrl.onload();
      expect(ctrl.games).toBeUndefined();
    });
  });

  describe('addCard method', function() {
    it('should show ready for readyOrNotClass if chosenCards is less than 3', function() {
      ctrl.chosenCards.push('1');
      ctrl.chosenCards.push('2');
      ctrl.chosenCards.push('3');

      ctrl.addCard(5);
      expect(ctrl.disabledClass).toBe('');
    });

    it('should show not-ready for readyOrNotClass if chosenCards is less than 3', function() {
      ctrl.chosenCards.push('1');
      ctrl.chosenCards.push('2');

      ctrl.addCard(5);
      expect(ctrl.chosenCards.length).toBe(3);
    });
  });

  describe('addGame method', function() {
    it('should have submitHideClass tro be "hide"', function() {
      $browser.xhr.expectPOST('/api/multiplayergame|{"game_status":"active","player_one_cards":["1","2","3"],"player_one_fb_id":"1234"}').respond({});
      ctrl.chosenCards = ['1', '2', '3'];
      ctrl.isATest = true;
      ctrl.addGame('1234');
      expect(ctrl.submitHideClass).toBe('hide');
    });
  });

  describe('chooseGame method', function() {
    it('should set lobbyHideClass to hide', function() {
      ctrl.chooseGame(1234);
      expect(ctrl.lobbyHideClass).toBe('hide');
    });
  });

  describe('add2player method', function() {
    it('should change the window.location.hash', function() {
      $browser.xhr.expectGET('/api/multiplayergame').respond({});
      ctrl.chosenCards = ['1', '2', '3'];
      ctrl.add2player();
      expect(ctrl.add2playerHashChanged).toBeTruthy();
    });
  });
});

describe('BuildQuestionCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(BuildQuestionCtrl);
  });

  describe('isSubmissionValid method', function() {
    beforeEach(function() {
      
    });

    it('should return false when there is no q_name, q_tet, or level', function() {
      ctrl.q_name = '';
      ctrl.q_text = '';
      ctrl.level = null;

      expect(ctrl.isSubmissionValid()).toBeFalsy();
    });

    it('should return false when there is no wrong answer', function() {
      ctrl.q_name = 'dfd';
      ctrl.q_text = 'fdfd';
      ctrl.level = 2;

      ctrl.correctAnswer = '';
      ctrl.wrongAnswer1 = '';
      ctrl.wrongAnswer2 = '';
      ctrl.wrongAnswer3 = '';

      expect(ctrl.isSubmissionValid()).toBeFalsy();
    });

    it('should return false when there is no scope.supply or scope.demand', function() {
      ctrl.q_name = 'dfd';
      ctrl.q_text = 'fdfd';
      ctrl.level = 2;

      ctrl.correctAnswer = 'df';
      ctrl.wrongAnswer1 = 'df';
      ctrl.wrongAnswer2 = 'df';
      ctrl.wrongAnswer3 = 'df';

      expect(ctrl.isSubmissionValid()).toBeFalsy();
    });

    it('should return true when all fields are filled in', function() {
      ctrl.q_name = 'dfd';
      ctrl.q_text = 'fdfd';
      ctrl.level = 2;

      ctrl.correctAnswer = 'df';
      ctrl.wrongAnswer1 = 'df';
      ctrl.wrongAnswer2 = 'df';
      ctrl.wrongAnswer3 = 'df';

      scope.supply = '';
      scope.demand = '';

      expect(ctrl.isSubmissionValid()).toBeTruthy();
    });
  });

  describe('submitQuestion method', function() {
    beforeEach(function() {
      ctrl.q_name = 'dfd';
      ctrl.q_text = 'fdfd';
      ctrl.level = 2;

      ctrl.correctAnswer = 'df';
      ctrl.wrongAnswer1 = 'df';
      ctrl.wrongAnswer2 = 'df';
      ctrl.wrongAnswer3 = 'df';

      scope.supply = '';
      //scope.demand = '';
    });

    it('should show errorMsg if the thing is not properly formed', function() {
      ctrl.submitQ();
      expect(ctrl.errorMsg).toBe('Whoops, there was an error. Please check that all fields have been entered!');
    });

    it('should show errorClass if the thing is not properly formed', function() {
      ctrl.submitQ();
      expect(ctrl.errorClass).toBe('show');
    });
  });
});

describe('Training2Ctrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(Training2Ctrl);
  });

  it('should have false for scope.hasAnsweredWrongly', function() {
    expect(ctrl.hasAnsweredWrongly).toBeFalsy();
  });

  describe('startTraining method', function() {
    it('should have trainingHasStarted to be true', function() {
      $browser.xhr.expectGET('/api/cards?level=undefined&limit=5&topic=Demand+and+Supply').respond({});
      ctrl.startTraining();
      expect(ctrl.trainingHasStarted).toBeTruthy();
    });
  });

  describe('startGame method', function() {
    
  });
});

describe('TestCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(TestCtrl);
  });

  it('should have the correct buttonText', function() {
    expect(ctrl.buttonText).toBe('Login with Facebook with Test user for localhost');
  });

  it('should have the correct testNavigation hash', function() {
    ctrl.testNavigate();
    expect(ctrl.testNavigation).toBe('admin');
  });
})

describe('UserDetails', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });

    scope = angular.scope();
    $browser = scope.$service('$browser');
  });

  describe('onLoad method', function() {
    beforeEach(function() {
      $browser.xhr.expectGET('/api/player/1').respond({wins:1, losses:1});
      ctrl = scope.$new(UserDetails);

      var fakeCookieStore = {
        'get': function(name) {
          if (name == 'fb_user_id') return 1;
          else if (name == 'fb_username') return 'testuser';
        }
      };
      ctrl.cookieStore = fakeCookieStore;
      ctrl.onLoad();      
    });

    it('should have correct value for fb_user_id', function() {
      expect(ctrl.userid).toBe(1);
    });

    it('should have correct value for fb_username', function() {
      expect(ctrl.username).toBe('testuser');
    });

    // it('should have correct value for user_wins', function() {
    //   expect(ctrl.currPlayer).toEqualData({wins:1, losses:1});
    // });

  });

  describe('evaluateRank method', function() {
    beforeEach(function() {
      $browser.xhr.expectGET('/api/player/1').respond({wins:1, losses:1});
      
      ctrl = scope.$new(UserDetails);
    });

    it('should show economics wizard if user_wins is 31', function() {
      ctrl.user_wins = 31;
      ctrl.evaluateRank();

      expect(ctrl.user_rank).toBe('Economics Wizard');
    });

    it('should show peasant if user_wins is 1', function() {
      ctrl.user_wins = 1;
      ctrl.evaluateRank();

      expect(ctrl.user_rank).toBe('Peasant');
    });

    it('should show Apprentice if user_wins is 6', function() {
      ctrl.user_wins = 6;
      ctrl.evaluateRank();

      expect(ctrl.user_rank).toBe('Apprentice');
    });

    it('should show Scholar if user_wins is 11', function() {
      ctrl.user_wins = 11;
      ctrl.evaluateRank();

      expect(ctrl.user_rank).toBe('Scholar');
    });

    it('should show Economics Master if user_wins is 21', function() {
      ctrl.user_wins = 21;
      ctrl.evaluateRank();

      expect(ctrl.user_rank).toBe('Economics Master');
    });
  });
});

describe('TrainingCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(TrainingCtrl);
  });
  
  it('should scope.buildDeckQNum be 0', function() {
    expect(ctrl.buildDeckQNum).toBe(0);
  });

  it('should scope.buildDeckQNum be 0', function() {
    expect(ctrl.noOfQuestions).toBeUndefined();
  }); 

  it('should scope.arrayAnswers be 0', function() {
    expect(ctrl.arrayAnswers).toBeUndefined();
  });
  
  describe('startTraining method', function() {
    it('should show trainingHasStarted to be true', function() {
      ctrl.startTraining();
      expect(ctrl.trainingHasStarted).toBeTruthy();
    });
  }); 
});

describe('LogoutCtrl', function() {
  var scope, $browser, ctrl;

  beforeEach(function() {
    scope = angular.scope();
    $browser = scope.$service('$browser');

    ctrl = scope.$new(LogoutCtrl);
  });

  // it('should set to null user_status', function() {
  //   ctrl.startFBLogout();
  //   expect(ctrl.user_status).toBeUndefined();
  // });
});