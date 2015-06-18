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
    remoteHost: 'http://175.186.105.58:8080',
};

// form patterns
ym.patterns = {
    username: {
        pattern: /^[a-zA-Z0-9]{5,20}$/,
    },

    password: {
        pattern: /^.{6,20}$/,
    },

    nickname: {
        pattern: /^.{,20}$/,
    },
};

// http status
ym.httpStatus = {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Time-out',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Large',
    415: 'Unsupported Media Type',
    416: 'Requested Range not Satisfiable',
    417: 'Expectation Failed',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Time-out',
    505: 'HTTP Version not Supported',
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
ym.definePage = function(pageName, cb) {
    // load app
    var app = angular.module('ym.app');

    // log page load
    ym.log("load page ctrl: " + pageName);

    // pass to cb
    cb(app);
};

// a simple logger
ym.log = function(msg) {
    if(ym.config.debug)
        console.log(msg);
};

// export to global
window.ym = ym;

})();
