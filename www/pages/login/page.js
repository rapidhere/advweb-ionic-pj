/**
 * ng-ctrl script and route map for login page
 *
 * author: rapidhere@gmail.com
 */

ym.definePage('login', function(app) {
    'use strict';

    // routes
    app.config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'pages/login/login.html',
                controller: 'LoginCtrl',
            })
            .state('register', {
                url: '/register',
                templateUrl: 'pages/login/register.html',
                controller: 'RegisterCtrl',
            });

        $urlRouterProvider.otherwise('/login');
    });

    // LoginCtrl
    app.controller('LoginCtrl', function($scope, $location, $ionicHistory, User, ymRemote, ymUI) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();

        // hide nav bar
        $scope.showNav(false);

        // check if there is history login
        var histname = ym.localStorage.get('username') || '';
        var histpass = ym.localStorage.get('password') || '';

        // set to the input area
        $scope.username = histname;
        $scope.password = histpass;

        // current login?
        $scope.logining = false;
        // login event
        $scope.login = function() {
            // no repeat-login
            if($scope.logining)
                return;

            // validate
            // TODO

            // start to login
            $scope.logining = true;

            ymRemote.login($scope.username, $scope.password)
            .then(
            // success callback
            function(data) {
                // create new logined one
                var u = User.resource.parseRemote(data);

                // store password from form
                u.password = $scope.password;

                // get sessionKey
                u.sessionKey = data.session_key;

                // set to logined one
                User.resource.self = u;
                User.resource.set(u);

                // set localStorage history
                ym.localStorage.set('username', u.username);
                ym.localStorage.set('password', u.password);

                // goto main page
                $ionicHistory.clearCache();
                $location.path('/main/friends');
            },
            // error callback
            function(data) {
                ymUI.toastError(data);
            })
            // set login to false
            .finally(function() {
                $scope.logining = false;
            });
        };

        // register4 event
        $scope.register = function() {
            $location.path('/register');
        };
    });

    // ReigsterCtrl
    app.controller('RegisterCtrl', function($scope, $location, $ionicHistory, ymRemote, ymUI, User) {
        // show nav bar
        $scope.showNav(true);

        // scope vals bind to register page
        var formData = {
            username: '',
            password: '',
            passwordRepeat: '',
            mobile: '',
            gender: '',
        };

        $scope.formData = formData;

        // register flag
        var registering = false;

        // register user
        $scope.register = function() {
            // only one register in queue
            if(registering)
                return;

            registering = true;

            // validate gender
            var gender = 0;
            if(formData.gender === '男')
                gender = 1;

            // TODO
            // validate

            ymRemote.register(formData.username, gender, formData.mobile, formData.password)
            .then(
            // on success
            function(data) {
                // Toast success
                ymUI.toast('注册成功');

                // create new logined one
                var u = User.resource.parseRemote(data);

                // store password from form
                u.password = $scope.password;

                // get sessionKey
                u.sessionKey = data.session_key;

                // set to logined one
                User.resource.self = u;
                User.resource.set(u);

                // set localStorage history
                ym.localStorage.set('username', u.username);
                ym.localStorage.set('password', u.password);

                // goto main page
                $scope.showNav(true);
                $ionicHistory.clearCache();
                $location.path('/main/friends');
            },
            // on error
            function(data) {
                ymUI.toastError(data);
            })
            .finally(function() {
                registering = false;
            });
        };
    });
});
