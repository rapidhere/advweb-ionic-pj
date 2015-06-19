/**
 *  User Module CTRL script
 *  author: rapidhere@gmail.com
 */

ym.definePage('user', function(app) {
    'use strict';

    // routes
    app.config(function($stateProvider) {
        $stateProvider
            .state('user-info', {
                url: '/user-info/:id',
                templateUrl: 'pages/user/user-info.html',
                controller: 'UserInfoCtrl'
            })
            .state('modify-info', {
                url: '/modify-info',
                templateUrl: 'pages/user/modify-info.html',
                controller: 'ModifyInfoCtrl',
            })
            .state('contacts', {
                url: '/contacts',
                templateUrl: 'pages/user/contacts.html',
                controller: 'ContactsCtrl'
            });
    });

    // User Info Controller
    app.controller('UserInfoCtrl', function($scope, $stateParams, $ionicHistory, User, ymRemote, ymUI) {
        var uid = parseInt($stateParams.id);

        $scope.user = User.resource.get(uid);

        var removing = false;
        $scope.remove = function() {
            if(removing)
                return ;
            removing = true;

            ymRemote.removeFriend(User.resource.self.sessionKey, uid)
            .then(
            // on success
            function(data) {
                User.resource.remove(data.uid);
                $ionicHistory.goBack();
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                removing = false;
            });
        };
    });

    // Modify Info Controller
    app.controller('ModifyInfoCtrl', function($scope, $ionicHistory, User, ymUI, ymRemote) {
        // create form Data
        var u = User.resource.self;

        var formData = {
            username: u.username,
            portraitUrl: u.portraitUrl,
            nickname: u.nickname,
            mobile: u.mobile,
            gender: u.getGenderString()
        };

        // assign to form data
        $scope.formData = formData;
        $scope.user = u;

        // working flag
        var modifying = false;
        // Modify
        $scope.modify = function() {
            if(modifying)
                return ;

            modifying = true;

            // re-assign gender
            if(formData.gender === '男')
                formData.gender = 1;
            else
                formData.gender = 0;

            ymRemote.modifyInfo(u.sessionKey, formData)
            .then(
            // on success
            function(data) {
                ymUI.toast('修改成功');

                u.username = data.username;
                u.nickname = data.nickname;
                u.gender = data.gender;
                u.portraitUrl = data.portrait_url;
                u.mobile = data.mobile;

                $ionicHistory.goBack();
            },
            // on error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                modifying = false;
            });
        };

        // change portrait
        var changing = false;

        $scope.changePortrait = function() {
            if(changing)
                return ;
            changing = true;

            ymUI.getPicture()
            .then(
            // on success
            function(data) {
                ymRemote.updatePortrait(u.sessionKey, data)
                .then(
                // on success
                function(data) {
                    var url = ym.config.remoteHost + data;

                    formData.portraitUrl = url;
                    u.portraitUrl = url;

                    ymUI.toast('上传成功');
                },
                // on error
                function(e) {
                    ymUI.toastError(e);
                })
                .finally(function() {
                    changing = false;
                });
            },
            // on error
            function(msg) {
                changing = false;
                ymUI.toast('获取图片失败: ' + msg);
            });
        };
    });

    var gettingContacts = false;
    app.controller('ContactsCtrl', function($scope, $ionicHistory, ymRemote, ymUI, User) {
        $scope.cons = [];

        if(! gettingContacts) {
            gettingContacts = true;

            $scope.cons = [];

            // get contacts
            ymUI.getContacts()
            .then(
            // on success
            function(contacts) {
                var i;
                for(i = 0;i < contacts.length;i ++) {
                    contacts[i].checked = true;
                    $scope.cons.push(contacts[i]);
                }
                gettingContacts = false;
            },
            // on error
            function(msg) {
                ymUI.toast('获取通讯录失败: ' + msg);
                gettingContacts = false;
            });
        }

        var importing = false;
        $scope.import = function() {
            if(importing)
                return ;
            importing = true;

            var i, j;
            var r = [];
            var mobile;
            var cons = $scope.cons;

            for(i = 0;i < cons.length;i ++) {
                if(cons[i].checked) {
                    mobile = '';
                    for(j = 0;j < cons[i].mobile.length;j ++) {
                        if(cons[i].mobile[j] >= '0' && cons[i].mobile[j] <= '9') {
                            mobile += cons[i].mobile[j];
                        }
                    }

                    r.push(mobile);
                }
            }

            // call remote
            ymRemote.importContacts(User.resource.self.sessionKey, r)
            .then(
            // success
            function(data) {
                User.resource.addFriends(data);
                $ionicHistory.goBack();
            },
            // error
            function(e) {
                ymUI.toastError(e);
            })
            .finally(function() {
                importing = false;
            });
        };
    });
});
