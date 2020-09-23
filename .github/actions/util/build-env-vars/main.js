'use strict'

const core = require('@actions/core')
const github = require('@actions/github')

const branch = github.context.ref.replace(/^refs\/(?:tags|heads)\//, '')
const tag = github.context.ref.startsWith('refs/tags/') ? branch : ''
const buildNumber = github.context.runNumber + 10000

core.exportVariable('OT_BRANCH', branch)
core.exportVariable('OT_TAG', tag)
core.exportVariable('OT_BUILD', buildNumber)
