# fastify-tokenize
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71TSDF)<br>
[![License](https://img.shields.io/github/license/Bowser65/fastify-tokenize.svg?style=flat-square)](https://github.com/Bowser65/fastify-tokenize/blob/master/LICENSE)

An extremely tiny plugin for Fastify for [node-tokenize](https://npm.im/node-tokenize). Allows you to share the same
instance of Tokenize on every part of your server.

Also includes compatibility for the [fastify-auth](https://github.com/fastify/fastify-auth) plugin for enhanced
experience and flexibility in your Fastify server.

Tokenize leverages the pain of generating secure tokens and makes it easy to issue and validate tokens in your
application.

## Install
```
With PNPM:
pnpm i fastify-tokenize

With Yarn:
yarn add fastify-tokenize

With NPM:
npm i fastify-tokenize
```

## Usage
This plugin decorates the `fastify` instance with a `tokenize` object. This object is an instance of Tokenize
initialized with the secret provided.

```js
fastify.register(require('fastify-tokenize'), { secret: 'btw have i told you i use arch' })
```

### `fastify-auth` compatibility
You can make use of the very flexible [fastify-auth](https://github.com/fastify/fastify-auth) to authenticate users,
and let fastify-tokenize handle the whole part of authenticating the user. To enable it, just set `fastifyAuth` to
true, and compatibility functions will magically get added.

On successful authentications, fastify-tokenize will decorate the request with the `user` property. This property can
then be used within your app to greet users with their username or perform more specific checks.

It is mandatory to provide a `fetchAccount` option when registering fastify-tokenize. This method will receive the
account ID as unique argument and should the user account (or a promise resolving to a user account). The only
required property is `tokensValidSince` which is used to invalidate tokens generated prior this date.

```js
// We'll assume we use mongodb as our database here.

fastify.register(require('fastify-auth'))
fastify.register(require('fastify-mongodb'), { url: 'mongodb://localhost:27017/my-awesome-db' })
fastify.register(require('fastify-tokenize'), {
  fastifyAuth: true,
  fetchAccount: (userId) => fastify.mongo.db.collection('users').findOne({ _id: userId }),
  secret: 'btw have i told you i use arch'
})

fastify.route({
  method: 'GET',
  url: '/secure-place',
  // fastify.verifyTokenizeToken is added by fastify-tokenize when fastifyAuth is set to "true"
  preHandler: fastify.auth([ fastify.verifyTokenizeToken ]),
  handler: (req, reply) => {
    req.log.info('Auth route')
    reply.send({ hello: 'world' })
  }
})
```

By default, fastify-tokenize checks for either the `token` cookie without performing signature checks (will only work if
[fastify-cookie](https://github.com/fastify/fastify-cookie)) is registered, or a token passed in the `authorization`
header. You can obviously customize this for yourself through the following options:

 - Setting `cookie` to false will disable authentication through cookies. Same thing for `header`
 - Setting `cookie` to any string will tell fastify-tokenize to check for this cookie when attempting to authenticate a
request
 - You can set `cookieSigned` to true so fastify-tokenize knows the cookie has to be passed through `unsignCookie`
 - Setting `header` to `null` (default) will attempt to look for a naked token
 - Setting `header` to any string will tell fastify-tokenize to only look for specific authorization types
Example: if you set `header` to `User`, it'll look for `authorization: User <token>`
