// very _very_ naive argument parsing
'use strict'

module.exports = function parseArgs(argv) {
  return {
    flags: argv.filter(a => a.startsWith('-')),
    args: argv.filter(a => !a.startsWith('-')),
  }
}
