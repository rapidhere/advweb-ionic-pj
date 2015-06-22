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

    app.controller('SettingsCtrl', function($scope, $location, $ionicHistory, ymRemote, User, Activity) {
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

                Activity.resource.activites = {};
                Activity.resource.activityList = [];

                // goto login page
                $location.path('/login');

                logouting = false;
            });
        };
    });

    app.controller('ActivitiesCtrl', function($scope, $location, $ionicHistory, User, Activity, ymRemote, ymUI) {
        $scope.showNav(false);
        $ionicHistory.clearHistory();

        // refresh activities
        var refreshing = false;
        var refreshActivities = function(broadcast) {
            if(refreshing)
                return;

            refreshing = true;

            // refresh end function
            var _end = function() {
                refreshing = false;
                if(broadcast)
                    $scope.$broadcast('scroll.refreshComplete');
                // $scope.$apply();
            };

            // fetch
            ymRemote.getRelatedActivities(User.resource.self.sessionKey)
            .then(
            // on success
            function(data) {
                // get un updated user ids
                var uids = [];
                data.event_list.forEach(function(evt) {
                    var act = Activity.resource.parseRemote(evt);
                    Activity.resource.set(act);

                    // after get action, check user list
                    uids.push(act.publishUserId);
                    act.invitedUserStatus.forEach(function(s) {
                        uids.push(s.id);
                    });
                });

                // if no uid need to fetch
                // then fetch end
                if(uids.length === 0) {
                   _end();
                   return ;
                }

                // refreshing user list
                ymRemote.getUserInfos(User.resource.self.sessionKey, uids)
                .then(
                // on success
                function(data) {
                    // add to user resource
                    data.friend_list.forEach(function(d) {
                        var u = User.resource.parseRemote(d);
                        User.resource.update(u);
                    });

                    // end
                    _end();
                },
                // on error
                function(e) {
                    ymUI.toastError(e);

                    // end
                    _end();
                });
            },
            // on error
            function(e) {
                ymUI.toastError(e);
                _end();
            });
        };

        // refresh on enter
        refreshActivities();

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
