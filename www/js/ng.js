(function() {
/**
 * Some Angluar helper services
 *
 * author: rapidhere@gmail.com
 */

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

// Activity Model
helper.factory('Activity', function() {
    var Activity = function() {
        this.id = '';
        this.title = '';
        this.description = '';
        this.registerDeadLine = '';
        this.publishUserId = -1;
        this.optionalDate = [];
        this.optionalPosition = [];
        this.invitedUserStatus = [];
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

    return Activity;
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

    Datetime.recent = {};
    Datetime.recent.datetimes = [];

    Datetime.recent.add = function(d) {
       Datetime.recent.datetimes.push(d);
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

    Datetime.prototype.toUTC = function() {
        ret = '' +
            this.date.getFullYear() + '-' +
            (this.date.getMonth() + 1) + '-' +
            this.date.getDate() + 'T' +
            this.formatTime() + ':00';

        return ret;
    };

    return Datetime;
});

// ym remote
helper.factory('ymRemote', function($http, $q) {
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
                    error_message: 'unknown error',
                });
            } else {
                def.reject({
                    error_code: -1,
                    error_message: '' + status + ' ' + ym.httpStatus[status],
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

        var body = {
            title: a.title,
            description: a.description,
            register_deadline: a.ddl.toUTCString(),
            optional_position: [{locationX: 1.0, locationY: 1.0}],
        };

        body.optional_date = [];
        a.optionalDate.forEach(function(d) {
            body.optional_date.push(d.toUTC());
        });

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

    // export ymRemote
    return ymRemote;
});

})();
