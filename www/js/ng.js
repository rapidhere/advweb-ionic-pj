(function() {
/**
 * Some Angluar helper services
 *
 * author: rapidhere@gmail.com
 */
'use strict';

var helper = angular.module('ym.helper', ['ionic', 'ngCordova']);

helper.config(function($ionicConfigProvider) {
    // config back button
    $ionicConfigProvider.backButton.text('').previousTitleText(false);

    // config tab bar
    $ionicConfigProvider.tabs.position('top');
});

// toastMessage
helper.factory('ymUI', function($ionicLoading, $cordovaToast, $q) {
    var ymUI = {};

    var toast;
    ymUI.toast = toast = function(msg, duration, position) {
        duration = duration || 'short';
        position = position || 'bottom';

        // PhoneGap? Use native:
        if(!! window.cordova) {
            $cordovaToast.show(msg, duration, position);
            return ;
        }

        // … fallback / customized $ionicLoading:
        $ionicLoading.show({
            template: msg,
            noBackdrop: true,
            duration: (duration == 'short' ? 700 : 1500)
        });
    };

    ymUI.toastError = function(data) {
        ymUI.toast('错误 ' + data.error_code + ': ' + data.error_message, 'long', 'bottom');
    };

    ymUI.getPicture = function() {
        var def = $q.defer();

        if(! navigator.camera)
          return def.promise;

        navigator.camera.getPicture(
        // on success
        function(imageData) {
            def.resolve(imageData);
        },
        // on error
        function(msg) {
            def.reject(msg);
        },
        // configs
        {
            quality: 100,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            allowEdit: true,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: 64,
            targetHeight: 64,
            mediaType: Camera.MediaType.PICTURE,
            saveToPhotoAlbum: false
        });

        return def.promise;
    };

    ymUI.getContacts = function() {
        var def = $q.defer();

        if(! navigator.contactsPhoneNumbers)
            return def.promise;

        navigator.contactsPhoneNumbers.list(
        // on success
        function(contacts) {
            var ret = [];
            var i, j;
            var phones;

            for(i = 0;i < contacts.length;i ++) {
                phones = contacts[i].phoneNumbers;
                for(j = 0;j < phones.length;j ++) {
                    ret.push({
                        name: contacts[i].displayName,
                        mobile: phones[j].normalizedNumber
                    });
                }
            }

            def.resolve(ret);
        },
        // on error
        function(msg) {
            def.reject(msg);
        });

        return def.promise;
    };

    return ymUI;
});

// geolocation
helper.factory('ymGeo', function(ymUI) {
    var ymGeo = {};

    ymGeo.pos = null;

    ymGeo.getCurrentPosition  = function() {
        return ymGeo.pos;
    };

    ymGeo._fetching = false;
    ymGeo._ymUI = ymUI;

    ymGeo._fetch = function() {
        if(ymGeo._fetching)
            return ;
        ymGeo._fetching = true;

        navigator.geolocation.getCurrentPosition(
        // success
        function(pos) {
            ymGeo._fetching = false;
            ymGeo.pos = pos;
        },
        // error
        function(err) {
            ymGeo._fetching = false;
            ymGeo._ymUI.toast('定位失败: ' + err.message);
        },
        // options
        {
            timeout: 30 * 1000,
            enableHighAccuracy: true,
        });
    };

    return ymGeo;
});
helper.run(function(ymGeo, ymUI) {
    ymGeo._interval = setInterval(ymGeo._fetch, 30 * 1000);
    setTimeout(ymGeo._fetch, 2000);
});

// Activity Model
helper.factory('Activity', function(User, Datetime, Location) {
    var Activity = function() {
        this.id = '';
        this.title = '';
        this.description = '';
        this.registerDeadLine = '';
        this.publishUserId = -1;
        this.optionalDate = [];
        this.optionalPosition = [];
        this.invitedUserStatus = [];

        this.confirmed = 0;
        this.selectedDate = null;
        this.selectedPosition = null;
    };

    // Activity resource
    Activity.resource = {
        activites: {},
        activityList: []
    };

    // getter and setter of resource
    Activity.resource.set = function(a) {
        Activity.resource.activites[a.id] = a;

        var i = 0;
        for(i = 0;i < Activity.resource.activityList.length;i ++) {
            if(Activity.resource.activityList[i].id === a.id)
                break;
        }

        if(i >= Activity.resource.activityList.length)
            Activity.resource.activityList.push(a);
        else
            Activity.resource.activityList[i] = a;
    };

    Activity.resource.get = function(id) {
        return Activity.resource.activites[id];
    };

    // get activity from remote data
    Activity.resource.parseRemote = function(d) {
        var a = new Activity();

        // fill base info
        a.id = d.event_id;
        a.title = d.title;
        a.description = d.description;
        a.publishUserId = d.publisher_user_id;
        a.registerDeadLine = new Date(d.register_deadline);

        a.confirmed = d.confirmed;
        a.selectedDate = Datetime.resource.parse(d.selected_date);
        a.selectedPosition = Location.resource.parseRemote(d.selected_position);

        // fill arrays
        d.invited_user_status.forEach(function(u) {
            a.invitedUserStatus.push({
                id: u.user_id,
                status: u.status,
                chosenPosition: Location.resource.parseRemote(u.chosen_position),
                chosenDate: Datetime.resource.parse(u.chosen_date),
            });
        });

        d.optional_date.forEach(function(date) {
            a.optionalDate.push(Datetime.resource.parse(date));
        });

        // fill positions
        d.optional_position.forEach(function(data) {
            a.optionalPosition.push(Location.resource.parseRemote(data));
        });

        return a;
    };

    // get the publisher user
    Activity.prototype.getPublisher = function() {
        return User.resource.get(this.publishUserId);
    };

    // get status of this activity
    // 1 ended
    // 2 waiting (wait to start)
    // 3 register ended
    // 4 registering
    Activity.prototype.getStatus = function() {
        // get current time
        var now = new Date();

        if(this.confirmed) {
            if(now > this.selectedDate) {
                return 1;   // ended
            } else {
                return 2;   // waiting
            }
        } else {
            if(now > this.registerDeadLine) {
                return 3;   // register end
            } else {
                var i = 0;
                for(i = 0;i < this.invitedUserStatus.length;i ++) {
                    if(this.invitedUserStatus[i].status === 0)
                        return 4;
                }
                return 3;
            }
        }
    };

    // get the status of self in this activity
    Activity.prototype.getSelfStatus = function() {
        var i;
        for(i = 0;i < this.invitedUserStatus.length;i ++) {
            if(this.invitedUserStatus[i].id === User.resource.self.id)
                return this.invitedUserStatus[i].status;
        }

        return -1;
    };

    return Activity;
});

// Location Model
helper.factory('Location', function() {
    var Location = function() {
        this.lng = 1.0;
        this.lat = 1.0;
        this.title = '';
        this.address = '';
    };

    // record recent used location
    // use in select location page
    Location.recent = {};
    Location.recent.locations = [];

    Location.recent.add = function(d) {
       Location.recent.locations.push(d);
    };

    Location.recent.clear = function() {
        Datetime.recent.locations = [];
    };

    Location.resource = {};
    Location.resource.parseRemote = function(d) {
        if(! d)
            return null;

        var loc = new Location();
        loc.lat = d.lat;
        loc.lng = d.lng;
        loc.address = d.address;
        loc.title = d.title;

        return loc;
    };

    Location.prototype.toURIString = function() {
        return '' +
            this.lat + ',' +
            this.lng + ',' +
            this.address + ',' +
            this.title;
    };

    return Location;
});

// User Model
helper.factory('User', function() {
    var User = function() {
        this.username = '';
        this.nickname = '';
        this.gender = '';
        this.password = '';
        this.mobile = '';
        this.portraitUrl = '';
        this.sessionKey = '';

        this.isFriend = false;
        this.checked = false;
    };

    // User resource
    User.resource = {};

    // clear checked
    User.resource.clearChecked = function() {
        User.resource.userList.forEach(function(u) {
            u.checked = false;
        });
    };

    // get checked
    User.resource.getCheckedLength = function() {
        var cnt = 0, i = 0;
        for(i = 0;i < User.resource.userList.length;i ++) {
            if(User.resource.userList[i].checked)
                cnt ++;
        }

        return cnt;
    };

    // parse a remote
    User.resource.parseRemote = function(data) {
        var u = new User();

        // fill remote returned data
        u.id = data.uid;
        u.username = data.username;
        u.nickname = data.nickname;
        u.gender = data.gender;
        u.mobile = data.mobile;
        u.portraitUrl = 'img/ionic.png';
        if(data.portrait_url)
            u.portraitUrl = ym.config.remoteHost + data.portrait_url;

        return u;
    };

    // user list
    User.resource.userList = [];

    // add friends
    User.resource.addFriends = function(data) {
        var fs = data.friend_list || [];

        fs.forEach(function(f) {
            var u = User.resource.parseRemote(f);
            u.isFriend = true;

            User.resource.set(u);
        });
    };

    // resouce inner store
    User.resource.users = {};

    // the logined one (self)
    User.resource.self = null;

    // get a user by id from users
    // a promise function
    User.resource.get = function(id) {
        return User.resource.users[id];
    };

    // clear friends
    User.resource.clearFriends = function() {
        var newList = [];
        var i, u;

        for(i = 0;i < User.resource.userList.length;i ++) {
            u = User.resource.userList[i];

            if(u.isFriend) {
                delete User.resource.users[u.id];
            } else {
                newList.push(u);
            }
        }

        User.resource.userList = newList;
    };

    // remove a friend from list
    User.resource.remove = function(id) {
        var i, u;
        var l = User.resource.userList;
        for(i = 0;i < l.length;i ++) {
            u = l[i];

            if(u.id === id)
                break;
        }

        if(i >= l.length)
            return ;

        User.resource.userList = l.slice(0, i).concat(l.slice(i + 1));
        delete User.resource.users[u.id];
    };

    // update a resouce
    User.resource.set = function(u) {
        User.resource.users[u.id] = u;

        var i = 0;
        for(i = 0;i < User.resource.userList.length;i ++) {
            if(User.resource.userList[i].id === u.id)
                break;
        }

        if(i >= User.resource.userList.length)
            User.resource.userList.push(u);
        else
            User.resource.userList[i] = u;
    };

    // update, without friend scope
    User.resource.update = function(u) {
        var old = User.resource.users[u.id];
        var isFriend = old ? old.isFriend : false;

        User.resource.set(u);
        User.resource.get(u.id).isFriend = isFriend;
    };

    // user prototype functions
    // is this the user self?
    User.prototype.isSelf = function() {
        return this.id === User.resource.self.id;
    };

    // get the name
    User.prototype.getName = function() {
        if(this.nickname)
            return this.nickname;

        return this.username;
    };

    //  男 or 女
    User.prototype.getGenderString = function() {
        return this.gender ? '男' : '女';
    };

    return User;
});

// datetime
helper.factory('Datetime', function() {
    var Datetime = function() {
        this.date = new Date();
        this.time = 12600;
    };

    // record recent used datetimes
    // use in select datetimes page
    Datetime.recent = {};
    Datetime.recent.datetimes = [];

    Datetime.recent.add = function(d) {
       Datetime.recent.datetimes.push(d);
    };

    Datetime.recent.clear = function() {
        Datetime.recent.datetimes = [];
    };

    Datetime.prototype.formatTime = function() {
        var h = parseInt(this.time / 3600);
        var m = parseInt(this.time % 3600 / 60);

        var ret = '';
        if(h < 10)
            ret = '0' + h;
        else
            ret = '' + h;

        if(m < 10)
            ret += ' : 0' + m;
        else
            ret += ' : ' + m;

        return ret;
    };

    Datetime.prototype.toJsDate = function() {
        this.date = new Date('' +
            this.date.getFullYear() + '-' +
            (this.date.getMonth() + 1) + '-' +
            this.date.getDate());

        var epoch = this.date.getTime() + this.time * 1000;

        return new Date(epoch);
    };

    // resource
    Datetime.resource = {};

    // parse from a string
    Datetime.resource.parse = function(s) {
        if(! s)
            return null;

        var d = new Date(s);

        var dt = new Datetime();
        dt.date = new Date('' +
            d.getFullYear() + '-' +
            (d.getMonth() + 1) + '-' +
            d.getDate());
        dt.time = (d.getTime() - dt.date.getTime()) / 1000;

        return dt;
    };

    return Datetime;
});

// ym remote
helper.factory('ymRemote', function($http, $q, Location) {
    var ymRemote = {};

    // ym remote low level http wrapper
    var _http;
    ymRemote._http = _http = function(method, url, parameter, data) {
        var def = $q.defer();

        data = data || undefined;

        // construct req
        var req = {
            method: method.toUpperCase(),
            url: ym.config.remoteHost + url,
            params: parameter,
            data: data
        };

        // make request
        $http(req)
        // on success
        .success(function(data, status) {
            // handle error
            if(data.error_code < 0) {
                def.reject({
                    error_code: data.error_code,
                    error_message: data.error_message
                });

                return ;
            }

            // success
            def.resolve(data);
        })
        // on error
        .error(function(data, status, headers, config, statusText) {
            if(! status) {
                def.reject({
                    error_code: -1,
                    error_message: '网络连接错误',
                });
            } else {
                def.reject({
                    error_code: -1,
                    error_message: 'HTTP错误 ' + status + ' ' + ym.httpStatus[status],
                });
            }
        });

        return def.promise;
    };

    // a test echo function
    ymRemote.echo = function(msg) {
        msg = encodeURIComponent(msg);
        return _http('GET', '/echo/' + msg, {});
    };

    // get a bundle of user info
    ymRemote.getUserInfos = function(sessionKey, uids) {
        var pars = {
            session_key: sessionKey,
        };
        var ids = '';
        var i = 0;
        for(;i < uids.length;i ++) {
            ids = ids + uids[i] + ',';
        }
        // clear tailing comma
        ids = ids.slice(0, ids.length - 1);

        pars.ids = ids;

        return _http('GET', '/v1/user/batch_get', pars);
    };

    // register
    ymRemote.register = function(username, gender, mobile, password) {
        var pars = {
            username: username,
            password: password,
            gender: gender,
            mobile: mobile,
        };

        return _http('POST', '/v1/user/register', pars);
    };

    // login
    ymRemote.login = function(username, password) {
        var pars = {
            username: username,
            password: password,
        };

        return _http('POST', '/v1/user/login', pars);
    };

    // logout
    ymRemote.logout = function(sessionKey) {
        var pars = {
            session_key: sessionKey
        };

        return _http('POST', '/v1/user/logout', pars);
    };

    // modify user info
    ymRemote.modifyInfo = function(sessionKey, u) {
        var pars = {
            portrait_url: u.portraitUrl,
            gender: u.gender,
            nickname: u.nickname,
            mobile: u.mobile,
            session_key: sessionKey,
        };

        return _http('POST', '/v1/user/info', pars);
    };

    // upload image
    ymRemote.updatePortrait = function(sessionKey, imgData) {
        var pars = {
            session_key: sessionKey
        };

        return _http('POST', '/v1/user/update_portrait', pars, imgData);
    };

    // import
    ymRemote.importContacts = function(sessionKey, contacts) {
        var pars = {
            session_key: sessionKey,
        };

        return _http('POST', '/v1/friendship/batch_create', pars, contacts);
    };

    // get friends list
    ymRemote.getFriends = function(sessionKey) {
        var pars = {
            session_key: sessionKey,
            offset: 0,
            limit: 1000
        };

        return _http('GET', '/v1/friend/list', pars);
    };

    // remove a friend
    ymRemote.removeFriend = function(sessionKey, id) {
        var pars = {
            session_key: sessionKey,
            id: id,
        };

        return _http('POST', '/v1/friendship/destroy', pars);
    };

    // search friends
    ymRemote.searchFriends = function(sessionKey, keyWord) {
        var pars = {
            session_key: sessionKey,
            keyword: keyWord,
        };

        return _http('GET', '/v1/friend/search', pars);
    };

    // add friends
    ymRemote.addFriend = function(sessionKey, id) {
        var pars = {
            session_key: sessionKey,
            id: id,
        };

        return _http('POST', '/v1/friendship/create', pars);
    };

    // create a activity
    ymRemote.createActivity = function(sessionKey, a) {
        var pars = {
            session_key: sessionKey,
        };

        // fill basic
        var body = {
            title: a.title,
            description: a.description,
        };

        // re calc register ddl
        body.register_deadline = new Date('' +
            a.ddl.getFullYear() + '-' +
            (a.ddl.getMonth() + 1) + '-' +
            a.ddl.getDate());
        body.register_deadline = body.register_deadline.toISOString();

        // fill optional position
        body.optional_position = [];
        a.optionalPosition.forEach(function(pos) {
            body.optional_position.push({
                lng: pos.lng,
                lat: pos.lat,
                title: pos.title,
                address: pos.address
            });
        });

        // fill optional date
        body.optional_date = [];
        a.optionalDate.forEach(function(d) {
            body.optional_date.push(d.toJsDate().toISOString());
        });

        // fill user status
        body.invited_user_status = [];
        a.invitedUserId.forEach(function(id) {
            body.invited_user_status.push({
                user_id: id,
                chosen_date: null,
                chosen_position: null,
                status: 0
            });
        });

        return _http('POST', '/v1/activity/create', pars, JSON.stringify(body));
    };

    // get activities related to me
    ymRemote.getRelatedActivities = function(sessionKey) {
        var pars = {
            session_key: sessionKey,
            offset: 0,
            limit: 1000
        };

        return _http('GET', '/v1/activity/list', pars);
    };

    // get a single activity info
    ymRemote.getActivity = function(sessionKey, id) {
        var pars = {
            session_key: sessionKey,
            id: id
        };

        return _http('GET', '/v1/activity/', pars);
    };

    // reply a activity
    ymRemote.replyActivity = function(sessionKey, id, confirm, date, position) {
        if(confirm)
            confirm = 1;
        else
            confirm = 0;

        var pars = {
            session_key: sessionKey,
            id: id,
            confirm: confirm,
            date: date,
            position: encodeURIComponent(position)
        };


        return _http('POST', '/v1/activity/reply', pars);
    };

    // confirm a activity
    ymRemote.confirmActivity = function(sessionKey, id, date, position) {
        var pars = {
            session_key: sessionKey,
            id: id,
            date: date,
            position: encodeURIComponent(position)
        };

        return _http('POST', '/v1/activity/confirm', pars);
    };

    // update my position
    ymRemote.updateLocation = function(sessionKey, lng, lat) {
        var pars = {
            session_key: sessionKey,
        };

        var loc = new Location();
        loc.lng = lng;
        loc.lat = lat;
        loc.address = '_';
        loc.title = '_';

        pars.position = encodeURIComponent(loc.toURIString());

        return _http('POST', '/v1/location', pars);
    };

    // get other user's position
    ymRemote.getLocation = function(sessionKey, ids) {
        var pars = {
            session_key: sessionKey,
            ids: ids.join(',')
        };

        return _http('GET', '/v1/location/list', pars);
    };

    // export ymRemote
    return ymRemote;
});

})();
