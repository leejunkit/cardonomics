describe('Cardonomics', function() {
  beforeEach(function(){
    browser().navigateTo('../../app/index.html');
  });

  it('should automatically redirect to /partial/referrals.html when location hash/fragment is empty', function() {
      expect(browser().location().hash()).toBe("/nav/login");
  });

  describe('login.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/login');
    });

    it('should show change in login buttong', function(){
      expect(binding('buttonText')).toBe('Login with Facebook');
      element('.fb-login-btn').click();
      expect(binding('buttonText')).toBe('Please wait...');
    });
  });

  describe('route to all major html files from navigation bar',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/lobby');
    });

    it('should direct to lobby page (lobbyicon)',function(){
      element('.lobbyicon').click();
      expect(browser().location().hash()).toBe("/nav/lobby");
    });

    it('should direct to deckworkshop page (workshopicon)',function(){
      element('.workshopicon').click();
      expect(browser().location().hash()).toBe("/nav/deckworkshop");
    });

    it('should direct to training page (trainingicon)',function(){
      element('.trainingicon').click();
      expect(browser().location().hash()).toBe("/nav/training");
    });

    it('should direct to statistic page (statsicon)',function(){
      element('.statsicon').click();
      expect(browser().location().hash()).toBe("/nav/stats");
    });

    it('should direct to login page (logouticon)',function(){
      element('.logouticon').click();
      expect(browser().location().hash()).toBe("/nav/login");
    });
  });

  describe('lobby.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/lobby');
    });

    it('should direct to training page',function(){
      element('.btn-warning').click();
      expect(browser().location().hash()).toBe("/nav/training");
    });

    it('should direct to create multiplayer game page',function(){
      element('.btn-primary').click();
      expect(browser().location().hash()).toBe("/nav/createmultiplayergame");
    });

    it('should direct to multiplayer lobby page',function(){
      element('.btn-success').click();
      expect(browser().location().hash()).toBe("/nav/multiplayerlobby");
    });
  });

  describe('deckworkshop.html + success.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/deckworkshop');
      element('#startmsg a').click();
      element('#submitBtn1').click();
      expect(binding('errorMsg')).toBe('Whoops, there was an error. Please check that all fields have been entered!');
      input('q_name').enter('hahaQuestion');
      input('q_text').enter('this is the question to be submitted');
    });

    it('should direct to create mcq/graph question',function(){
      element('#mcqBtn1').click();
      input('correctAnswer').enter('correctAnswerlalala');
      input('wrongAnswer1').enter('wrongAnswer1lalala');
      input('wrongAnswer2').enter('wrongAnswer2lalala');
      input('wrongAnswer3').enter('wrongAnswer3lalala');
      element('#submitBtn1').click();
      browser().navigateTo('#/nav/success/1');
      expect(binding('card.topic')).toBe('Demand and Supply');
      expect(binding('card.question_body')).toBe('this is the question to be submitted');
      element('#lobbyBtn').click();
      expect(browser().location().hash()).toBe("/nav/lobby");
    });

    // it('should direct to create mcq/graph question',function(){
    //   element('#graphBtn1').click();
    //   element('#supplyLeftBtn1').click();
    //   element('#demandLeftBtn1').click();
    //   element('#submitBtn1').click();
    //   // browser().navigateTo('#/nav/success/2');
    //   expect(binding('card.topic')).toBe('Demand and Supply');
    //   expect(binding('card.question_body')).toBe('this is the question to be submitted');
    //   element('#lobbyBtn').click();
    //   expect(browser().location().hash()).toBe("/nav/lobby");
    // });
  });

  describe('training.html + training2.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/training');
    });

    it('should active Revise Cards tab',function(){
      expect(element('.tab-pane div:first:visible').count()).toEqual(1);
      expect(element('.tab-pane div:last:hidden').count()).toEqual(1);
      element('#revise').click();
      expect(element('.tab-pane div:first:hidden').count()).toEqual(1);
      expect(element('.tab-pane div:last:visible').count()).toEqual(1);
      element('.tab-pane a').click();
      browser().navigateTo('#/nav/training');
    });

    it('should customize training questions',function(){
      element('#levelOneBtn').click();
      element('#nolimit').click();
      element('#startBuildTrainingBtn').click();
      expect(browser().location().hash()).toBe("/nav/training/start");
    });
  });

  describe('training2.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/training');
    });

    it('should display mcq question card',function(){
      element('#levelOneBtn').click();
      element('#nolimit').click();
      element('#startBuildTrainingBtn').click();
      expect(browser().location().hash()).toBe("/nav/training/start");
    });
  });

  describe('stats.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/stats');
    });

    it('should go to training page',function(){
      expect(browser().location().hash()).toBe("/nav/stats");
      element('#trainingBtn').click();
      expect(browser().location().hash()).toBe("/nav/training");
    });

    it('should go to lobby page',function(){
      expect(browser().location().hash()).toBe("/nav/stats");
      element('#lobbyBtn').click();
      expect(browser().location().hash()).toBe("/nav/lobby");
    });
  });

  describe('createmultiplayergame.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/createmultiplayergame');
    });

    it('should display the card collection',function(){
      expect(repeater('.chooseCard ol').count()).toBe(0);
    });
  });

  describe('multiplayerlobby.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/multiplayerlobby');
    });

    it('should display the card collection',function(){
      expect(repeater('.tile-area a').count()).toBe(0);
    });
  });

  describe('multiplayer.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/multiplayer');
    });

    it('should display the card collection',function(){
      element('.lobbyicon').click();
      expect(browser().location().hash()).toBe("/nav/lobby");
    });
  });

  describe('logout.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/logout');
    });

    it('should direct to login page',function(){
      expect(browser().location().hash()).toBe("/nav/login");
    });
  });

  describe('referrals.html', function() {
    beforeEach(function() {
      browser().navigateTo('#/nav/ref');
    });

    it('should enable access with VALID email address', function() {
      expect(element('#msg').text()).toMatch();
      input('emailAddress').enter('haha@gmail.com');
      expect(element('#msg').text()).toMatch(/Looks good, let's go!/);
      expect(element('#refBtn').attr('value')).toBe('Give me early access!');
      element('#refBtn').click();
      expect(element('#refBtn').attr('value')).toBe('Please wait...');
    });

    it('should disable access with INVALID email address', function() {
      input('emailAddress').enter('haha@gmail');
      expect(element('#msg').text()).toMatch();
      element('#refBtn').click();
      expect(element('#msg').text()).toMatch(/Please enter a valid email address!/);
      expect(element('#refBtn').attr('value')).toBe('Give me early access!');
    });
  });
});
