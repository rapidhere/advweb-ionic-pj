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
];

// log
ym.log('app starting');

// app dep list
var depList = ['ngRoute'];

// add pages and then load ymApp
pageList.forEach(function(page) {
    // update controller into dep list
    depList.push('ymController-' + page);
});

// init module yuema
var app = angular.module('ymApp', depList);

// history back
app.run(function($window, $rootScope) {
    // add historyBack function to rootScope
    if(! $rootScope.historyBack)
        $rootScope.historyBack = function() {
            $window.history.back();
        };
});

// load ctrls
// add pages ctrls and styles
pageList.forEach(function(page) {
    // load in the index.html
    angular.element('head').append('<script src="pages/' + page + '/page.js"> </script>');
    angular.element('head').append('<link href="pages/' + page + '/style.css" rel="stylesheet">');
});

ym.log('app started');

})();
