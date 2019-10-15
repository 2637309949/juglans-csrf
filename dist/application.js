"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// Copyright (c) 2018-2020 Double.  All rights reserved.
// Use of this source code is governed by a MIT style
// license that can be found in the LICENSE file.
const assert = require('assert').strict;

const hasha = require('hasha');

const logger = require('./logger');

const ignore = {
  'HEAD': true,
  'OPTIONS': true
};

function _csrf(ctx) {
  var body = ctx.request.body;
  return body && body._csrf || ctx.query && ctx.query._csrf || ctx.get('x-csrf-token') || ctx.get('x-xsrf-token') || typeof body === 'string' && body;
}

function verify(_x, _x2, _x3) {
  return _verify.apply(this, arguments);
}

function _verify() {
  _verify = _asyncToGenerator(function* (ctx, next, options) {
    // Get the token
    var token = ctx.cookies.get(options.cookie, {
      signed: options.sign
    });
    if (!token) return ctx.throw(403, 'failed csrf check, no cookie value found'); // get the CSRF token

    var csrf = _csrf(ctx);

    if (!csrf) return ctx.throw(403, 'failed csrf check, no csrf token present');
    var hash = hasha(options.secret + '.' + token); // verify CSRF token passed in matches the hash

    if (hash === csrf) {
      yield next();
    } else {
      logger.error(ctx.request.path, ':invalid csrf token');
      ctx.throw(403, 'invalid csrf token');
    }
  });
  return _verify.apply(this, arguments);
}

function create(_x4, _x5, _x6) {
  return _create.apply(this, arguments);
}

function _create() {
  _create = _asyncToGenerator(function* (ctx, next, options) {
    var token = ctx.cookies.get(options.cookie, {
      signed: options.sign
    });

    if (!token) {
      yield next();
      return;
    }

    const csrf = hasha(options.secret + '.' + token);
    ctx.state = Object.assign(ctx.state || {}, {
      csrf: csrf
    });
    yield next();
  });
  return _create.apply(this, arguments);
}

module.exports = function () {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return (
    /*#__PURE__*/
    function () {
      var _ref2 = _asyncToGenerator(function* (_ref) {
        let {
          router
        } = _ref;
        let {
          secret,
          cookie,
          sign
        } = options;
        assert(secret, 'you must pass a server-side secret to use in the encryption');
        assert(cookie, 'you must pass the key of the cookie to generate the token and verify authenticity');
        router.use(
        /*#__PURE__*/
        function () {
          var _ref3 = _asyncToGenerator(function* (ctx, next) {
            if (ignore[ctx.method]) {
              yield next();
              return;
            }

            options.sign = sign = sign === undefined ? ctx.app.keys && ctx.app.keys.length : !!sign;

            if (ctx.method === 'GET') {
              yield create(ctx, next, options);
            } else {
              yield verify(ctx, next, options);
            }
          });

          return function (_x8, _x9) {
            return _ref3.apply(this, arguments);
          };
        }());
      });

      return function (_x7) {
        return _ref2.apply(this, arguments);
      };
    }()
  );
};