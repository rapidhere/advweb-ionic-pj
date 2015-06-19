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
    $ionicConfigProvider.tabs.position('bottom');
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
                var phones = contacts[i].phoneNumbers;
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

// User Model
helper.factory('User', function($q, ymRemote) {
    var User = function() {
        this.username = '';
        this.nickname = '';
        this.gender = '';
        this.password = '';
        this.mobile = '';
        this.portraitUrl = '';
        this.sessionKey = '';

        this.isFriend = false;
    };

    // User resource
    User.resource = {};

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
    }

    // update a resouce
    User.resource.set = function(u) {
        if(! User.resource.users[u.id]) {
            User.resource.userList.push(u);
        }

        User.resource.users[u.id] = u;
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
    return ymRemote;
});

})();
