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
];

// log
ym.log('app starting');

// init module yuema
var app = angular.module('ym.app', [
    'ionic',
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
            angular.element('ion-nav-bar').hide();
        else
            angular.element('ion-nav-bar').show();
    };
});

ym.log('app started');

})();
