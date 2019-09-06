## juglans-csrf (For MVC)
Had authentication been cookie-based, it would have been vulnerable to csrf, because cookies are sent automatically.

### For Restful API (base on token validation)

- user login in, obtain indentify token, save it to cookie attribute name which diff from background verification attribute or save it to storage.
Example:
```javascript
export function setToken(token) {
  localStorage.setItem('identity', token);
}
```

- modif all http request with header attribute.
```javascript
export default bambooRequest.createRequest(
  {
    middle() {
      return res => {
        if (res.status >= 200 && res.status < 300) return res;
        if (res.status === 401) dispatch({ type: 'login/logout' });
        const locale = formatMessage({ id: res.status, defaultMessage: res.status });
        const error = new Error(locale);
        error.locale = locale;
        throw error;
      };
    },
    option: { credentials: 'include' },
  },
  option => deepmerge.all([option, { headers: { accessToken: getToken() } }]),
);
```
that because the cross-site pseudo request cannot be modified or read cookies （我的英语有点憋屈QAQ）

### For MVC (base on csrf token validation)

- generate csrf token 
```javascript
app.use(function * (next) {
  if ('GET' == this.method) {
    // this.body = this.state.csrf
  }
  // render dom with csrf token
  // <meta name="csrf-token" content="{{ csrf }}">
}
```

- 
```javascript
<script type="text/javascript">
    var csrf_token = document.querySelector("meta[name='csrf-token']").getAttribute("content");
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS)$/.test(method));
    }
    var o = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(){
        var res = o.apply(this, arguments);
        var err = new Error();
        if (!csrfSafeMethod(arguments[0])) {
            this.setRequestHeader('x-csrf-token', csrf_token);
        }
        return res;
    };
 </script>
```
- valid csrf token 
```javascript
app.use(function * (next) {
  if ('POST' == this.method) {
    this.body = 'protected area';
  }
})
```