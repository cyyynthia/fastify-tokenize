/*
 * Copyright (c) 2020 Cynthia K. Rey, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

const Tokenize = require('@cyyynthia/tokenize')
const fp = require('fastify-plugin')

function fastifyTokenize (fastify, options, next) {
  if (!options.secret) {
    next(new Error('`secret` parameter is mandatory'))
    return
  }

  if (typeof options.secret !== 'string') {
    next(new Error('`secret` parameter must be a string'))
    return
  }

  if (fastify.tokenize) {
    next(new Error('fastify-tokenize has already registered'))
    return
  }

  const tokenize = new Tokenize(options.secret)
  fastify.decorate('tokenize', tokenize)
  fastify.decorateRequest('user', null)
  fastify.addHook('onRequest', (req, _, done) => {
    // Wipe user for every request
    req.user = null
    done()
  })

  if (options.fastifyAuth) {
    if (!options.fetchAccount) {
      next(new Error('`fetchAccount` parameter is mandatory when using fastify-auth compatibility'))
      return
    }

    if (typeof options.fetchAccount !== 'function') {
      next(new Error('`fetchAccount` parameter must be a function'))
      return
    }

    let cookie = 'token'
    let header = null
    if (typeof options.cookie !== 'undefined') {
      if (options.cookie !== false && (typeof options.cookie !== 'string' || !options.cookie)) {
        next(new Error('`cookie` parameter must be either a string or false.'))
        return
      }

      // eslint-disable-next-line prefer-destructuring
      cookie = options.cookie
    }
    if (typeof options.header !== 'undefined') {
      if (options.header !== false && options.header !== null && (typeof options.header !== 'string' || !options.header)) {
        next(new Error('`header` parameter must be either a string, null or false.'))
        return
      }

      // eslint-disable-next-line prefer-destructuring
      header = options.header
    }

    if (cookie === false && header === false) {
      next(new Error('You can\'t disable both cookies and headers!'))
      return
    }

    if (![ 'undefined', 'boolean' ].includes(typeof options.cookieSigned)) {
      next(new Error('`cookieSigned` parameter must be a boolean.'))
      return
    }

    fastify.decorate('verifyTokenizeToken', async function (request, reply) {
      let token
      if (cookie !== false && request.cookies) { // Try to find cookie
        token = request.cookies[cookie]
        if (token && options.cookieSigned) {
          const tokenCookie = reply.unsignCookie(token)
          token = tokenCookie.valid && tokenCookie.value
        }
      }
      if (!token && header !== false) { // Try to find header
        token = request.headers.authorization
        if (token && header !== null) {
          const splitted = token.split(' ')
          token = splitted.length !== 2 || splitted[0] !== header ? null : splitted[1]
        }
      }

      if (!token) {
        throw new Error('No authentication token found')
      }
      // Validate token
      const user = await this.tokenize.validate(token, options.fetchAccount.bind(this))
      if (user === false) {
        throw new Error('Invalid token')
      }
      if (user === null) {
        throw new Error('User not found')
      }
      request.user = user
    })
  }

  next()
}

module.exports = fp(fastifyTokenize, { fastify: '>= 3', name: 'fastify-tokenize' })
