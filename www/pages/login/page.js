/**
 * ng-ctrl script and route map for login page
 *
 * author: rapidhere@gmail.com
 */

ym.definePage('login', [], function(app, ctrl) {
    'use strict';

    // routes
    app.config(function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'pages/login/login.html',
                controller: 'LoginCtrl'
            })
            .when('/register', {
                templateUrl: 'pages/login/register.html',
                controller: 'RegisterCtrl'
            })
            .when('/', {
                redirectTo: '/login'
            });
    });


    ctrl.factory('userModel', function() {
        // User Model
        var User = function() {
            this.username = '';
            this.gender = '';
            this.password = '';
            this.mobile = '';
            this.sessionKey = '';
        };

        User.prototype.logined = null;

        return User;
    });

    // LoginCtrl
    ctrl.controller('LoginCtrl', function($scope, $location, userModel) {
        // check if there is history login
        var histname = ym.localStorage.get('username') || '';
        var histpass = ym.localStorage.get('password') || '';

        // set to the input area
        $scope.username = histname;
        $scope.password = histpass;

        // login event
        $scope.login = function() {
            console.log('username: ' + $scope.username);
            console.log('password: ' + $scope.password);

            // TODO: successfully login
            /*jshint ignore:start*/
            var u = new userModel();
            /*jshint ignore:end*/

            u.username = $scope.username;
            u.password = '123123';
            u.sessionKey = '12321321';
            u.gender = '1';
            u.mobile = '18321718627';

            // set to logined one
            userModel.logined = u;

            // goto main page
            $location.path('/main').replace();
        };

        // register4 event
        $scope.register = function() {
            $location.path('/register');
        };
    });

    // ReigsterCtrl
    ctrl.controller('RegisterCtrl', function($scope) {
        // scope vals bind to register page
        $scope.username = '';
        $scope.password = '';
        $scope.passwordRepeat = '';
        $scope.mobile = '';
        $scope.gender = '';

        // register user
        $scope.register = function() {

        };
    });
});
