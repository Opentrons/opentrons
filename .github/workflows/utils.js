'use strict'

const { execSync } = require('child_process')

module.exports = {
  /*
   * Build the environment variables OT_BRANCH, OT_TAG, and OT_BUILD used in
   * various other build tasks and set them in the environment for use after
   * the current step ends.
   *
   * param core: The github core package instance made available by actions/github-script
   * param context: The github context instance made available by actions/github-script
   */
  buildComplexEnvVars: (core, context) => {
    const branch = context.ref.replace(/^refs\/(?:tags|heads)\//, '')
    const tag = context.ref.startsWith('refs/tags/') ? branch : ''
    const buildNumber = context.sha
    console.log(
      `OT_BRANCH: ${branch}\nOT_TAG: ${tag}\nOT_BUILD: ${buildNumber}\n`
    )
    core.exportVariable('OT_BRANCH', branch)
    core.exportVariable('OT_TAG', tag)
    core.exportVariable('OT_BUILD', buildNumber)
  },
}
