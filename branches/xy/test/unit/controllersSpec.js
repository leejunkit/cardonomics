/* jasmine specs for controllers go here */

describe('NavCtrl', function(){
  var scope, $browser, navCtrl;

  beforeEach(function(){
    scope = angular.scope();
    $browser = scope.$service('$browser');
    navCtrl = scope.$new(NewCtrl());
  });


  it('should ....', function() {
    //spec body
  });
});


describe('MyCtrl2', function(){
  var myCtrl2;


  beforeEach(function(){
    myCtrl2 = new MyCtrl2();
  });


  it('should ....', function() {
    //spec body
  });
});
