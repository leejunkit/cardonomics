describe('Cardonomics', function() {
  beforeEach(function(){
    browser().navigateTo('../../app/index.html');
  });

  it('should automatically redirect to /partial/referrals.html when location hash/fragment is empty', function() {
      expect(browser().location().hash()).toBe("/nav/login");
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

  describe('lobby.html',function(){
    beforeEach(function() {
      browser().navigateTo('#/nav/lobby');
    });

    it('should direct to lobby page',function(){
      expect(browser().location().hash()).toBe("/nav/lobby");
      element('.lobbyicon').click();
      expect(browser().location().hash()).toBe("/nav/lobby");
    });

    it('should direct to deckworkshop page',function(){
      expect(browser().location().hash()).toBe("/nav/lobby");
      element('.workshopicon').click();
      expect(browser().location().hash()).toBe("/nav/deckworkshop");
    });

    it('should direct to training page',function(){
      expect(browser().location().hash()).toBe("/nav/lobby");
      element('.trainingicon').click();
      expect(browser().location().hash()).toBe("/nav/training");
    });

    it('should direct to statistic page',function(){
      expect(browser().location().hash()).toBe("/nav/lobby");
      element('.statsicon').click();
      expect(browser().location().hash()).toBe("/nav/stats");
    });

    it('should direct to logout page',function(){
      expect(browser().location().hash()).toBe("/nav/lobby");
      element('.logouticon').click();
      expect(browser().location().hash()).toBe("/nav/login");
    });
  });
});
