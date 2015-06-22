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
            .state('main.activities.all', {
                url: '/all',
                views: {
                    'activities-all': {
                        templateUrl: 'pages/activity/all.html',
                    }
                }
            })
            .state('main.activities.invites', {
                url: '/invites',
                views: {
                    'activities-invites': {
                        templateUrl: 'pages/activity/invites.html',
                        controller: 'InvitesActivityCtrl',
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
            })
            .state('main.activityDetail', {
                url: '/activityDetail/:id',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/activity/activity-detail.html',
                        controller: 'ActivityDetailCtrl'
                    }
                }
            })
            .state('main.selectPositions', {
                url: '/selectPositions',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/activity/select-pos.html',
                        controller: 'SelectPositionsCtrl',
                    }
                }
            })
            .state('main.selectedPositions', {
                url: '/selectedPositions',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/activity/select-positions.html',
                        controller: 'SelectedPositionsCtrl',
                    }
                }
            })
            .state('main.activityStatus', {
                url: '/activityStatus/:id',
                views: {
                    'menuContent': {
                        templateUrl: 'pages/activity/activity-status.html',
                        controller: 'ActivityStatusCtrl',
                    }
                }
            });
    });

    // activity status
    app.controller('ActivityStatusCtrl', function($scope, $stateParams, $interval, Activity, ymGeo, ymRemote, User) {
        // get activity id
        var aid = parseInt($stateParams.id);

        // get activity
        var act = Activity.resource.get(aid);

        // get uid in this activity
        var uids = [act.publishUserId];
        act.invitedUserStatus.forEach(function(s) {
            if(s.status == 1)
                uids.push(s.id);
        });

        // update to users array
        var users = [];
        uids.forEach(function(i) {
            users.push(User.resource.get(i));
        });

        // user positions
        var userLocation = [];
        // init user positions
        users.forEach(function(u) {
            userLocation.push({
                id: u.id,
                portraitUrl: u.portraitUrl,

                marker: null,
                icon: null,
                lng: null,
                lat: null,
                route: null,

                restTime: 'N/A',
                distance: 'N/A',
                restTimeFormat: 'N/A',
            });
        });
        $scope.users = userLocation;

        $scope.late = function(u) {
            if(u.restTime === 'N/A')
                return false;

            var s = new Date();
            var t = new Date(s.getTime() + u.restTime * 1000);
            return t >= act.selectedDate.toJsDate();
        };

        // global map
        var map;

        // make marker for a user
        var _makeMarker = function(u) {
            u.icon = new BMap.Icon(u.portraitUrl, new BMap.Size(32, 32));
            u.icon.setImageSize(new BMap.Size(32, 32));
            u.marker = new BMap.Marker(new BMap.Point(u.lng, u.lat), {icon: u.icon});

            // only self need route
            var renderOptions = {autoViewport: false};
            if(u.id === User.resource.self.id)
                renderOptions.map = map;

            u.route = new BMap.DrivingRoute(new BMap.Point(u.lng, u.lat), {
                renderOptions: renderOptions,
                onSearchComplete: function(results) {
                    if(u.route.getStatus() !== BMAP_STATUS_SUCCESS)
                        return ;

                    var plan = results.getPlan(0);
                    u.restTime = plan.getDuration(false);
                    u.distance = plan.getDistance(true);
                    u.restTimeFormat = '' + parseInt(u.restTime / 60) + '分钟';
                }
            });

            map.addOverlay(u.marker);
        };

        // create location fetcher
        // location fetch the location data and update these on the map
        var _locationFetcher = function() {
            // update self's poistion info
            var lng = 121.57, lat = 31.192;
            var pos = ymGeo.getCurrentPosition();
            if(pos) {
                lng = pos.coords.longitude;
                lat = pos.coords.latitude;
            }

            ymRemote.updateLocation(User.resource.self.sessionKey, lng, lat);

            // get other's info
            ymRemote.getLocation(User.resource.self.sessionKey, uids)
            .then(
            // on success only, do not check error
            function(data) {
                userLocation.forEach(function(u) {
                    if(data.position_map[u.id]) {
                        u.lng = data.position_map[u.id].lng;
                        u.lat = data.position_map[u.id].lat;

                        if(! u.marker)
                            _makeMarker(u);
                    }
                });
            }).
            finally(function() {
                // update info on the map
                var dest = new BMap.Point(act.selectedPosition.lng, act.selectedPosition.lat);
                userLocation.forEach(function(u) {
                    if(! u.lng)
                        return ;

                    var p = new BMap.Point(u.lng, u.lat);
                    u.marker.setPosition(p, dest);
                    u.route.search(p, dest);
                });
            });
        };

        // create interval, clear on leave
        var inter = $interval(_locationFetcher, 30 * 1000);
        _locationFetcher();
        $scope.$on('$ionicView.leave', function(){
            $interval.cancel(inter);
        });

        // load users as scope data
        $scope.data = {};
        $scope.data.users = [];

        // load baidu map
        var loaded = false;
        $scope.loadMap = function() {
          if(loaded)
                return ;
            loaded = true;

            // create map
            map = new BMap.Map('sel-map-1', {enableMapClick:false});

            var lng = 121.57, lat = 31.192;
            var pos = ymGeo.getCurrentPosition();
            if(pos) {
                lng = pos.coords.longitude;
                lat = pos.coords.latitude;
            }

            var point = new BMap.Point(lng, lat);
            map.centerAndZoom(point, 15);

            // put dest on the map
            var dest = new BMap.Marker(new BMap.Point(act.selectedPosition.lng, act.selectedPosition.lat));
            map.addOverlay(dest);

            // load controls
            var scaleControl=new BMap.ScaleControl();
            map.addControl(scaleControl);
            var GeolocationControl=new BMap.GeolocationControl();
            map.addControl(GeolocationControl);
        };
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

    // seleced positions
    app.controller('SelectedPositionsCtrl', function($scope, $location, $ionicSideMenuDelegate, Location) {
        // disalbe side menu swipe
        $scope.$on('$ionicView.enter', function(){
            $ionicSideMenuDelegate.canDragContent(false);
        });
        $scope.$on('$ionicView.leave', function(){
            $ionicSideMenuDelegate.canDragContent(true);
        });

        $scope.locations = Location.recent;

        $scope.add = function() {
            $location.path('/main/selectPositions');
        };
    });

    // select positions
    app.controller('SelectPositionsCtrl', function($scope, $ionicSideMenuDelegate, $ionicHistory, ymGeo, Location) {
        // disalbe side menu swipe
        $scope.$on('$ionicView.enter', function(){
            $ionicSideMenuDelegate.canDragContent(false);
        });
        $scope.$on('$ionicView.leave', function(){
            $ionicSideMenuDelegate.canDragContent(true);
        });

        $scope.searchLocation = '';

        $scope.d = {};
        $scope.d.resultR = null;

        var loaded = false;
        var ret = [];
        $scope.loadMap = function() {
            if(loaded)
                return ;
            loaded = true;

            // create map
            var map = new BMap.Map('sel-map', {enableMapClick:false});
            var pos = ymGeo.getCurrentPosition();

            var lng = 121.59, lat = 31.192;
            if(pos) {
                lng = pos.coords.longitude;
                lat = pos.coords.latitude;
            }

            var point = new BMap.Point(lng, lat);
            map.centerAndZoom(point, 15);

            // load controls
            var scaleControl=new BMap.ScaleControl();
            map.addControl(scaleControl);
            var GeolocationControl=new BMap.GeolocationControl();
            map.addControl(GeolocationControl);

            // markers
            var local = new BMap.LocalSearch(map, {
                onSearchComplete: function(results) {
                    if(local.getStatus() != BMAP_STATUS_SUCCESS)
                        return ;

                    map.clearOverlays();

                    // create markers
                    var i;
                    for(i = 0;i < results.getCurrentNumPois();i ++)
                        ret.push(results.getPoi(i));

                    ret.forEach(function(r) {
                        var marker = new BMap.Marker(r.point);

                        var info = new BMap.InfoWindow(r.address, {
                            width: 150,
                            height: 70,
                            title: r.title
                        });

                        marker.addEventListener('click', function() {
                            console.log('Here');
                            map.openInfoWindow(info, marker.getPosition());

                            $scope.d.resultR = r;
                        });

                        map.addOverlay(marker);
                        map.addOverlay(info);
                    });
                }
            });

            $scope.enter = function() {
                var r = $scope.d.resultR;
                if(r) {
                    var loc = new Location();
                    loc.address = r.address;
                    loc.title = r.title;
                    loc.lat = r.point.lat;
                    loc.lng = r.point.lng;

                    Location.recent.add(loc);
                }

                $ionicHistory.goBack();
            };


            // search call back
            $scope.searchPos = function() {
                if($scope.searchLocation)
                    local.search($scope.searchLocation);
            };
        };
    });

    // activity detail
    app.controller('ActivityDetailCtrl', function($scope, $stateParams, $ionicSideMenuDelegate, $location, User, Activity, ymUI, ymRemote) {
        // disable side menu delegate
        $scope.$on('$ionicView.enter', function(){
            $ionicSideMenuDelegate.canDragContent(false);
        });
        $scope.$on('$ionicView.leave', function(){
            $ionicSideMenuDelegate.canDragContent(true);
        });

        var aid = parseInt($stateParams.id);
        $scope.users = User.resource;

        $scope.data = {};
        $scope.data.act = Activity.resource.get(aid);
        $scope.data.datetime = '';
        $scope.data.location = '';

        $scope.countDate = function(d) {
            var cnt = 0;
            var jsd = d.toJsDate();
            $scope.data.act.invitedUserStatus.forEach(function(s) {
                if(s.chosenDate && s.chosenDate.toJsDate().getTime() === jsd.getTime())
                    cnt ++;
            });

            return cnt;
        };

        $scope.countLocation = function(l) {
            var cnt = 0;
            $scope.data.act.invitedUserStatus.forEach(function(s) {
                if(s.chosenPosition && s.chosenPosition.lat === l.lat && s.chosenPosition.lng === l.lng)
                    cnt ++;
            });

            return cnt;
        };

        $scope.canChose = function() {
            var act = $scope.data.act;

            return (act.getStatus() === 4 && act.getSelfStatus() === 0) ||
                (act.getSelfStatus() === -1 && act.getStatus() >= 3);
        };

        // refresh this act
        var refreshing = false;
        var refresh = function(broadcast) {
            if(refreshing)
                return ;

            refreshing = true;

            ymRemote.getActivity(User.resource.self.sessionKey, aid)
            .then(
            // on success
            function(data) {
                var act = Activity.resource.parseRemote(data);
                Activity.resource.set(act);

                $scope.data.act = act;
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                refreshing = false;
                if(broadcast)
                    $scope.$broadcast('scroll.refreshComplete');
            });
        };

        // load and refresh
        refresh(false);

        $scope.doRefresh = function() {
            refresh(true);
        };

        // reply a act
        var replying = false;
        $scope.reply = function(confirm) {
            if(replying)
                return ;

            replying = true;

            ymRemote.replyActivity(User.resource.self.sessionKey, aid, confirm, $scope.data.datetime, $scope.data.location)
            .then(
            // on success
            function(data) {
                var act = Activity.resource.parseRemote(data);
                Activity.resource.set(act);

                $scope.data.act = act;
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                replying = false;
            });
        };

        // confirm a act
        var confirming = false;
        $scope.confirm = function() {
            if(confirming)
                return ;

            confirming = true;

            ymRemote.confirmActivity(User.resource.self.sessionKey, aid, $scope.data.datetime, $scope.data.location)
            .then(
            // on success
            function(data) {
                var act = Activity.resource.parseRemote(data);
                Activity.resource.set(act);

                $scope.data.act = act;
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                confirming = false;
            });
        };

        // see the status
        $scope.status = function() {
            $location.path('/main/activityStatus/' + aid);
        };
    });

    // mine ctrl
    app.controller('MineActivitiesCtrl', function($scope, User) {
        $scope.actFilter = function(val) {
            return val.publishUserId === User.resource.self.id;
        };
    });

    // invtes ctrl
    app.controller('InvitesActivityCtrl', function($scope, User) {
        $scope.actFilter = function(val) {
            return val.getStatus() === 4 && // i.e., registering, and not replied
                val.getSelfStatus() === 0;
        };
    });

    // create activity controller
    var data = {
        title: '',
        description: '',
        ddl: new Date(),
    };

    app.controller('CreateActivityCtrl', function($scope, $location, ymRemote, ymUI, User, Datetime, Location, Activity) {
        $scope.users = User.resource;
        $scope.datetimes = Datetime.recent;
        $scope.locations = Location.recent;

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
            Datetime.recent.datetimes.forEach(function(dt) {
                dt.toJsDate();
            });
            data.optionalDate = Datetime.recent.datetimes;

            // get positions
            data.optionalPosition = Location.recent.locations;

            ymRemote.createActivity(User.resource.self.sessionKey, data)
            .then(
            // on success
            function(data) {
                // parse data and update
                var act = Activity.resource.parseRemote(data);
                Activity.resource.set(act);

                $location.path('/main/activities/mine');

                // clear data
                User.resource.clearChecked();
                Datetime.recent.clear();
                Location.recent.clear();

                data.title = '';
                data.description = '';
                data.ddl = new Date();
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
