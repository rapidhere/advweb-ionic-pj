/**
 * The main page control, route and model script
 * author: rapidhere@gmail.com
 */

ym.definePage('main', function(app) {
    'use strict';

    // routes info
    app.config(function($stateProvider) {
        $stateProvider
            .state('main', {
                url: '/main',
                templateUrl: 'pages/main/main.html',
                abstract: true,
            })
            .state('main.friends', {
                url: '/friends',
                views: {
                    'tab-friends': {
                        controller: 'FriendsCtrl',
                        templateUrl: 'pages/main/friends.html',
                    }
                }
            })
            .state('main.activities', {
                url: '/activities',
                views: {
                    'tab-activities': {
                        controller: 'ActivitiesCtrl',
                        templateUrl: 'pages/main/activities.html',
                    }
                }
            })
            .state('main.settings', {
                url: '/settings',
                views: {
                    'tab-settings': {
                        controller: 'SettingsCtrl',
                        templateUrl: 'pages/main/settings.html',
                    }
                }
            })
            .state('about', {
                url: '/about',
                templateUrl: 'pages/main/about.html',
            });
    });

    app.controller('SettingsCtrl', function($scope, $location, $ionicHistory, ymRemote, User) {
        $ionicHistory.clearHistory();

        // must not be null
        $scope.self = User.resource.self;

        // logout flag
        var logouting = false;

        // logout
        $scope.logout = function() {
            if(logouting)
                return ;

            logouting = true;

            // store history login
            ym.localStorage.set('username', User.resource.self.username);
            ym.localStorage.set('password', User.resource.self.password);

            // logout from remote
            ymRemote.logout($scope.self.sessionKey)
            .finally(function() {
                // set userModel to null
                User.resource.users = {};
                User.resource.self = null;

                // goto login page
                $location.path('/login');

                logouting = false;
            });
        };
    });

    app.controller('ActivitiesCtrl', function($scope, $location, $ionicHistory) {
        $ionicHistory.clearHistory();
    });

    app.controller('FriendsCtrl', function($scope, $location, $ionicHistory, User) {
        $ionicHistory.clearHistory();

        // get all users
        var users = [];
        for(var key in User.resource.users) {
            if(User.resource.users.hasOwnProperty(key)) {
                users.push(User.resource.users[key]);
            }
        }

        // set scope
        $scope.users = users;

        $scope.filterFunc = function(val) {
            return val.isFriend || val.isSelf();
        };
    });
});
