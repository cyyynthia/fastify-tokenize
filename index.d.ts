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

import type { default as Tokenize, AccountFetcher, AsyncAccountFetcher } from '@cyyynthia/tokenize'
import type { FastifyPluginCallback, FastifyReply } from 'fastify'
import type { RouteGenericInterface } from 'fastify/types/route'

declare namespace FastifyTokenize {
  interface Options {
    secret: string
  }

  interface OptionsAuth extends Options {
    fastifyAuth: true,
    fetchAccount: AccountFetcher | AsyncAccountFetcher,
    cookie?: string | false,
    header?: string | null | false
    cookieSigned?: boolean
  }
}

declare module 'fastify' {
  interface RequestGenericInterface {
    TokenizeUser?: unknown
  }

  interface FastifyRequest<RouteGeneric extends RouteGenericInterface = RouteGenericInterface> {
    user?: RouteGeneric['TokenizeUser'] | null
  }

  interface FastifyInstance {
    readonly tokenize: Tokenize
    verifyTokenizeToken (request: FastifyRequest, reply: FastifyReply): Promise<void>
  }
}

declare const fastifyTokenize: FastifyPluginCallback<FastifyTokenize.Options | FastifyTokenize.OptionsAuth>
export default fastifyTokenize
