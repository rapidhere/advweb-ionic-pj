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
            });
    });

    // User Info Controller
    app.controller('UserInfoCtrl', function($scope, $stateParams, User) {
        var uid = parseInt($stateParams.id);

        $scope.user = User.resource.get(uid);
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
    });
});
