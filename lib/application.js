// Copyright (c) 2018-2020 Double.  All rights reserved.
// Use of this source code is governed by a MIT style
// license that can be found in the LICENSE file.

const assert = require('assert').strict
const hasha = require('hasha')
const logger = require('logger')

const ignore = {
  'HEAD': true,
  'OPTIONS': true
}

function _csrf (ctx) {
  var body = ctx.request.body
  return (body && body._csrf) ||
    (ctx.query && ctx.query._csrf) ||
    (ctx.get('x-csrf-token')) ||
    (ctx.get('x-xsrf-token')) ||
    (typeof body === 'string' && body)
}

async function verify (ctx, next, options) {
  // Get the token
  var token = ctx.cookies.get(options.cookie, { signed: options.sign })
  if (!token) return ctx.throw(403, 'failed csrf check, no cookie value found')

  // get the CSRF token
  var csrf = _csrf(ctx)
  if (!csrf) return ctx.throw(403, 'failed csrf check, no csrf token present')

  var hash = hasha(options.secret + '.' + token)

  // verify CSRF token passed in matches the hash
  if (hash === csrf) {
    await next()
  } else {
    logger.error(ctx.request.path, ':invalid csrf token')
    ctx.throw(403, 'invalid csrf token')
  }
}

async function create (ctx, next, options) {
  var token = ctx.cookies.get(options.cookie, { signed: options.sign })
  if (!token) {
    await next()
    return
  }
  const csrf = hasha(options.secret + '.' + token)
  ctx.state = Object.assign(ctx.state || {}, {
    csrf: csrf
  })
  await next()
}

module.exports = (options = {}) => async function ({ router }) {
  let { secret, cookie, sign } = options
  assert(secret, 'you must pass a server-side secret to use in the encryption')
  assert(cookie, 'you must pass the key of the cookie to generate the token and verify authenticity')
  assert(cookie, 'you must pass the key of the cookie to generate the token and verify authenticity')
  router.use(async function (ctx, next) {
    if (ignore[ctx.method]) {
      await next()
      return
    }
    sign = sign === undefined
      ? ctx.app.keys && ctx.app.keys.length
      : !!sign
    if (ctx.method === 'GET') {
      await create(ctx, next, options)
    } else {
      await verify(ctx, next, options)
    }
  })
}
