'use strict'

const assert = require('assert')
const path = require('path')
const express = require('express')

const USAGE = 'node ./scripts/serve-static <content_path>'
assert(process.argv[2], USAGE)

const content = path.resolve(process.cwd(), process.argv[2])
const port = process.env.PORT || 9090
const app = express()

app.use(express.static(content))
app
  .listen(port)
  .once('listening', () => console.log(`Listening on http://localhost:${port}`))
  .once('error', error => {
    console.error(error)
    process.exit(1)
  })
