/**
 * controller scripts for activity moduel
 * author: rapidhere@gmail.com
 */

ym.definePage('activity', function(app) {
    // routes
    app.config(function($stateProvider) {
        $stateProvider
            .state('main.activities.mine', {
                url: '/mine',
                views: {
                    'activities-mine': {
                        templateUrl: 'pages/activity/mine.html',
                        controller: 'MineActivitiesCtrl'
                    }
                }
            })
            .state('main.activities.ended', {
                url: '/ended',
                views: {
                    'activities-ended': {
                        templateUrl: 'pages/activity/ended.html',
                    }
                }
            })
            .state('main.activities.invites', {
                url: '/invites',
                views: {
                    'activities-invites': {
                        templateUrl: 'pages/activity/invites.html'
                    }
                }
            })
            .state('main.activities.create', {
                url: '/create',
                views: {
                    'activities-create': {
                        templateUrl: 'pages/activity/create.html',
                        controller: 'CreateActivityCtrl',
                    }
                }
            })
            .state('main.selectDatetimes', {
                url: '/selectDatetimes',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/activity/select-datetimes.html',
                        controller: 'SelectDatetimesCtrl',
                    }
                }
            });
    });

    // select datetimes
    app.controller('SelectDatetimesCtrl', function($scope, Datetime) {
        $scope.datetimes = Datetime.recent;

        // do nothing
        $scope.datePickerCallback = function(){};
        $scope.timePickerCallback = function(){};

        // add a new time
        $scope.add = function() {
            var dt = new Datetime();
            Datetime.recent.add(dt);
        };
    });

    // mine ctrl
    app.controller('MineActivitiesCtrl', function($scope, User) {
        $scope.actFilter = function(val) {
            return val.publishUserId === User.resource.self.id;
        };
    });

    // create activity controller
    var data = {
        title: '',
        description: '',
        ddl: new Date(),
    };

    app.controller('CreateActivityCtrl', function($scope, ymRemote, ymUI, User, Datetime) {
        $scope.users = User.resource;
        $scope.datetimes = Datetime.recent;

        $scope.data = data;

        // do nothing
        $scope.datePickerCallback = function(){};

        // create
        var creating = false;
        $scope.create = function() {
            if(creating)
                return;
            creating = true;

            // get ids
            data.invitedUserId = [];
            User.resource.userList.forEach(function(u) {
                if(u.checked)
                    data.invitedUserId.push(u.id);
            });

            // get dates
            data.optionalDate = Datetime.recent.datetimes;

            ymRemote.createActivity(User.resource.self.sessionKey, data)
            .then(
            // on success
            function(data) {
                console.log(data);
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                creating = false;
            });
        };
    });
});
