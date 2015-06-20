(function() {
/**
 * app index script
 *
 * author: rapidhere@gmail.com
 */

'use strict';

// page list
var pageList = [
    'login',
    'main',
    'user',
    'activity',
];

// log
ym.log('app starting');

// init module yuema
var app = angular.module('ym.app', [
    'ionic',
    'ionic-timepicker',
    'ionic-datepicker',
    'ym.helper',
    'ngCordova',
]);

// load ctrls
// add pages ctrls and styles
pageList.forEach(function(page) {
    // load in the index.html
    angular.element('head').append('<script src="pages/' + page + '/page.js"> </script>');
    angular.element('head').append('<link href="pages/' + page + '/style.css" rel="stylesheet">');
});

// The Root Ctrl
app.controller('RootCtrl',function($scope, $ionicNavBarDelegate) {
    $scope.showNav = function(flag) {
        if(! flag)
            angular.element('#top-ion-nav-bar').hide();
        else
            angular.element('#top-ion-nav-bar').show();
    };
});

ym.log('app started');

})();
