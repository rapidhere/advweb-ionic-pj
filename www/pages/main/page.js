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
                controller: 'MainCtrl',
            })
            .state('main.friends', {
                url: '/friends',
                views: {
                    'menuContent': {
                        controller: 'FriendsCtrl',
                        templateUrl: 'pages/main/friends.html',
                    }
                }
            })
            .state('main.activities', {
                url: '/activities',
                views: {
                    'menuContent': {
                        controller: 'ActivitiesCtrl',
                        templateUrl: 'pages/main/activities.html',
                        abstract: true
                    }
                }
            })
            .state('main.settings', {
                url: '/settings',
                views: {
                    'menuContent': {
                        controller: 'SettingsCtrl',
                        templateUrl: 'pages/main/settings.html',
                    }
                }
            })
            .state('main.about', {
                url: '/about',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/main/about.html',
                    }
                }
            });
    });

    app.controller('MainCtrl', function($scope, User) {
        $scope._self = User.resource.self;
    });

    app.controller('SettingsCtrl', function($scope, $location, $ionicHistory, ymRemote, User) {
        $scope.showNav(false);
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
                User.resource.userList = [];
                User.resource.self = null;

                // goto login page
                $location.path('/login');

                logouting = false;
            });
        };
    });

    app.controller('ActivitiesCtrl', function($scope, $location, $ionicHistory, User, Activity) {
        $scope.showNav(false);
        $ionicHistory.clearHistory();

        // refresh activities
        var refreshing = false;
        var refreshActivities = function(broadcast) {
            if(refreshing)
                return;

            refreshing = true;
        };

        // set scopes
        $scope.doRefresh = function() {
            refreshActivities(true);
        };
        $scope.activites = Activity.resource;
    });

    app.controller('FriendsCtrl', function($scope, $location, $ionicHistory, User, ymRemote, ymUI) {
        $scope.showNav(false);
        $ionicHistory.clearHistory();

        // refresh list
        var refreshing = false;
        var refreshFriends = function(broadcast) {
            if(refreshing)
                return ;
            refreshing = true;

            ymRemote.getFriends(User.resource.self.sessionKey)
            .then(
            // on success
            function(data) {
                User.resource.clearFriends();
                User.resource.addFriends(data);
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                refreshing = false;

                if(broadcast) {
                    $scope.$broadcast('scroll.refreshComplete');
                }
            });
        };

        refreshFriends();

        // set scope
        $scope.users = User.resource;
        $scope.doRefresh = function() {
            refreshFriends(true);
        };

        $scope.filterFunc = function(val) {
            return val.isFriend;
        };
    });
});
