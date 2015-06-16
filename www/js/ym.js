(function() {
/**
 *  Yuema app framework
 *  author: rapidhere@gmail.com
 */
'use strict';

// the ym lib
var ym = {};

// configs
ym.config = {
    debug: true,
};

// a localStorage wrapper
ym.localStorage = {
    set: function(key, val) {
        localStorage.setItem('yuema-' + key, val);
    },

    get: function(key) {
        return localStorage.getItem('yuema-' + key);
    }
};

// define a page
// dep is default with a ionic dep
ym.definePage = function(pageName, dep, cb) {
    // push ionic dep into dep list
    dep.push('ionic');

    // load controller module
    var ctrl = angular.module('ymController-' + pageName, dep);

    // load app
    var app = angular.module('ymApp');

    // log page load
    ym.log("load page ctrl: " + pageName);

    // pass to cb
    cb(app, ctrl);
};

// a simple logger
ym.log = function(msg) {
    if(ym.config.debug)
        console.log(msg);
};

// export to global
window.ym = ym;

})();
