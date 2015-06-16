/**
 * The main page control, route and model script
 * author: rapidhere@gmail.com
 */

ym.definePage('main', [], function(app, ctrl) {
    'use strict';

    // routes info
    app.config(function($routeProvider) {
        $routeProvider
            .when('/main', {
                templateUrl: 'pages/main/main.html',
                controller: 'MainCtrl'
            });
    });

    // Main Ctrl
    ctrl.controller('MainCtrl', function($scope, userModel) {
        // must not be null
        $scope.user = userModel.logined;
    });
});
