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
helper.factory('ymUI', function($ionicLoading, $cordovaToast) {
    var ymUI = {};

    var toast;
    ymUI.toast = toast = function(msg, duration, position) {
        if(!duration)
            duration = 'short';
        if(!position)
            position = 'top';

        // PhoneGap? Use native:
        if(!! window.cordova) {
            $cordovaToast.show(msg, duration, location)
            .then(
            function() {
                ym.log('toasted');
            },
            function(e) {
                ym.log('toast error' + err);
            });
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

    return ymUI;
});

// User Model
helper.factory('User', function($q) {
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

    // resouce inner store
    User.resource.users = {};

    // the logined one (self)
    User.resource.self = null;

    // get a user by id from users
    // a promise function
    User.resource.get = function(id) {
        return User.resource.users[id];
    };

    // update a resouce
    User.resource.set = function(u) {
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
    ymRemote._http = _http = function(method, url, parameter) {
        var def = $q.defer();

        // construct req
        var req = {
            method: method.toUpperCase(),
            url: ym.config.remoteHost + url,
            params: parameter,
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

    return ymRemote;
});

})();
