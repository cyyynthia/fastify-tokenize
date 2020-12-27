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

/* eslint-env jest */

const Fastify = require('fastify')
const Tokenize = require('@cyyynthia/tokenize')
const fastifyTokenize = require('./index')
let fastify

function register (opts = {}) {
  return fastify.register(fastifyTokenize, { secret: 'meow', ...opts })
}

describe('fastify-tokenize', function () {
  beforeEach(function () {
    fastify = Fastify()
  })

  afterEach(function () {
    fastify.close()
  })

  describe('options validation', function () {
    it('should require the presence of `secret` option', async function () {
      expect.assertions(1)
      fastify.register(fastifyTokenize)
      return expect(fastify.ready()).rejects.toThrow(/mandatory/)
    })

    it('should make sure `secret` is a string', async function () {
      expect.assertions(1)
      fastify.register(fastifyTokenize, { secret: true })
      return expect(fastify.ready()).rejects.toThrow(/string/)
    })

    it('should require the presence of `fetchAccount` option when `fastifyAuth` is true', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true })
      return expect(fastify.ready()).rejects.toThrow(/mandatory/)
    })

    it('should make sure `fetchAccount` is a function', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: 'meow' })
      return expect(fastify.ready()).rejects.toThrow(/function/)
    })

    it('should accept `false` as a value for `cookie`', function () {
      register({ fastifyAuth: true, fetchAccount: () => null, cookie: false })
      return fastify.ready()
    })

    it('should accept a string as a value for `cookie`', async function () {
      register({ fastifyAuth: true, fetchAccount: () => null, cookie: 'very-nice-auth-token' })
      return fastify.ready()
    })

    it('should reject invalid `cookie` values', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null, cookie: 69 })
      return expect(fastify.ready()).rejects.toThrow(/must be/)
    })

    it('should accept `false` as a value for `header`', function () {
      register({ fastifyAuth: true, fetchAccount: () => null, header: false })
      return fastify.ready()
    })

    it('should accept `null` as a value for `header`', function () {
      register({ fastifyAuth: true, fetchAccount: () => null, header: null })
      return fastify.ready()
    })

    it('should accept a string as a value for `header`', async function () {
      register({ fastifyAuth: true, fetchAccount: () => null, header: 'User' })
      return fastify.ready()
    })

    it('should reject invalid `header` values', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null, header: 69 })
      return expect(fastify.ready()).rejects.toThrow(/must be/)
    })

    it('should not allow having both `cookie` and `header` set to false', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null, header: false, cookie: false })
      return expect(fastify.ready()).rejects.toThrow(/disable both/)
    })

    it('should make sure `cookieSigned` is a boolean', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null, cookieSigned: 'meow' })
      return expect(fastify.ready()).rejects.toThrow(/boolean/)
    })
  })

  describe('fastify decoration', function () {
    it('should not let register fastify-tokenize multiple times', function () {
      expect.assertions(1)
      register()
      register()
      return expect(fastify.ready()).rejects.toThrow(/already/)
    })

    it('should add a `tokenize` property to fastify', async function () {
      expect.assertions(2)
      await register().ready()
      expect(fastify).toHaveProperty('tokenize')
      expect(fastify.tokenize).toBeInstanceOf(Tokenize)
    })

    it('should not add a `verifyTokenizeToken` property to fastify if `fastifyAuth` isn\'t set', async function () {
      expect.assertions(1)
      await register().ready()
      expect(fastify).not.toHaveProperty('verifyTokenizeToken')
    })

    it('should add a `verifyTokenizeToken` property to fastify with fastifyAuth', async function () {
      expect.assertions(2)
      await register({ fastifyAuth: true, fetchAccount: () => null }).ready()
      expect(fastify).toHaveProperty('verifyTokenizeToken')
      expect(typeof fastify.verifyTokenizeToken).toBe('function')
    })
  })

  describe('token validation', function () {
    it('should return an error for invalid tokens', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null })
      await fastify.ready()

      const forgedReq = { cookies: { token: 'meow' }, headers: {} }
      return expect(fastify.verifyTokenizeToken(forgedReq, null)).rejects.toThrow(/invalid token/i)
    })

    it('should return an error for tokens that are not bound to any user', async function () {
      expect.assertions(1)
      register({ fastifyAuth: true, fetchAccount: () => null })
      await fastify.ready()

      const forgedReq = { cookies: { token: fastify.tokenize.generate('meow') }, headers: {} }
      return expect(fastify.verifyTokenizeToken(forgedReq, null)).rejects.toThrow(/not found/i)
    })

    it('should go through if the token is valid', async function () {
      register({ fastifyAuth: true, fetchAccount: () => ({ lastTokenReset: 0 }) })
      await fastify.ready()

      const forgedReq = { cookies: { token: fastify.tokenize.generate('meow') }, headers: {} }
      await fastify.verifyTokenizeToken(forgedReq, null)
    })

    describe('cookies', function () {
      it('should target the right cookie', async function () {
        register({ fastifyAuth: true, fetchAccount: () => ({ lastTokenReset: 0 }), cookie: 'rawr' })
        await fastify.ready()

        const forgedReq = { cookies: { rawr: fastify.tokenize.generate('meow') }, headers: {} }
        await fastify.verifyTokenizeToken(forgedReq, null)
      })

      it('should not attempt to use cookie', async function () {
        expect.assertions(1)
        register({ fastifyAuth: true, fetchAccount: () => null, cookie: false })
        await fastify.ready()

        const forgedReq = { cookies: { token: 'meow' }, headers: {} }
        return expect(fastify.verifyTokenizeToken(forgedReq, null)).rejects.toThrow(/token found/i)
      })

      it('should attempt to unsign the token if `cookieSigned` is set to true', async function () {
        expect.assertions(1)
        register({ fastifyAuth: true, fetchAccount: () => ({ lastTokenReset: 0 }), cookieSigned: true })
        await fastify.ready()

        const unsignCookie = jest.fn(t => ({ valid: true, value: t }))
        const forgedReq = { cookies: { token: fastify.tokenize.generate('meow') }, headers: {} }
        const forgedRes = { unsignCookie }
        await fastify.verifyTokenizeToken(forgedReq, forgedRes)
        return expect(unsignCookie.mock.calls.length).toBe(1)
      })

      it('should not attempt to unsign the token if `cookieSigned` isn\'t set to true', async function () {
        expect.assertions(1)
        register({ fastifyAuth: true, fetchAccount: () => ({ lastTokenReset: 0 }) })
        await fastify.ready()

        const unsignCookie = jest.fn(t => ({ valid: true, value: t }))
        const forgedReq = { cookies: { token: fastify.tokenize.generate('meow') }, headers: {} }
        const forgedRes = { unsignCookie }
        await fastify.verifyTokenizeToken(forgedReq, forgedRes)
        return expect(unsignCookie.mock.calls.length).toBe(0)
      })
    })

    describe('headers', function () {
      it('should target the specified authorization method only', async function () {
        expect.assertions(1)
        register({ fastifyAuth: true, fetchAccount: () => null, header: 'User' })
        await fastify.ready()

        const forgedReq = { cookies: {}, headers: { authorization: 'meow' } }
        return expect(fastify.verifyTokenizeToken(forgedReq, null)).rejects.toThrow(/token found/i)
      })

      it('should not attempt to use header', async function () {
        expect.assertions(1)
        register({ fastifyAuth: true, fetchAccount: () => null, header: false })
        await fastify.ready()

        const forgedReq = { cookies: {}, headers: { authorization: 'meow' } }
        return expect(fastify.verifyTokenizeToken(forgedReq, null)).rejects.toThrow(/token found/i)
      })
    })
  })
})
