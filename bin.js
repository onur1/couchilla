#!/usr/bin/env node
/* eslint-disable no-console */

const couchilla = require('./lib')
const path = require('path')

const args = process.argv.slice(2)

if (!args.length) {
  console.error('usage: couchilla DIR')
  process.exit(1)
}

couchilla(path.resolve(args[0]), (er, doc) => {
  if (er) {
    console.error(er.message)
    process.exit(1)
  }
  console.log(JSON.stringify(doc))
})
