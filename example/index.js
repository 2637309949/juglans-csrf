const path = require('path')
const render = require('koa-ejs')
const Juglans = require('../../juglans')
const csrf = require('../')

const app = new Juglans({ name: 'Juglans V1.0' })
app.Config({
  name: 'Juglans V1.0',
  prefix: '',
  port: 3001,
  debug: true
})
app.Use(csrf({
  secret: '17yd8d9dj',
  cookie: 'token'
}))
app.Use(function ({ httpProxy }) {
  render(httpProxy, {
    root: path.join(__dirname, 'view'),
    layout: 'index',
    viewExt: 'ejs',
    cache: false,
    debug: false
  })
  httpProxy.use(function (ctx, next) {
    ctx.state = ctx.state || {}
    ctx.state.now = new Date()
    ctx.state.ip = ctx.ip
    ctx.state.version = '2.0.0'
    return next()
  })
})
app.GET('/user', async function (ctx) {
  await ctx.render('user', {_csrf: ctx.state.csrf})
})
app.POST('/user', async function (ctx) {
  ctx.body = 'ok'
})
app.Run()
