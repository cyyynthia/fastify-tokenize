# fastify-tokenize
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71TSDF)<br>
[![License](https://img.shields.io/github/license/Bowser65/fastify-tokenize.svg?style=flat-square)](https://github.com/Bowser65/fastify-tokenize/blob/master/LICENSE)

An extremely tiny plugin for Fastify for [node-tokenize](https://npm.im/node-tokenize). Allows you to share the same
instance of Tokenize on every part of your server.

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
