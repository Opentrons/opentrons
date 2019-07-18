'use strict'

/**
 * Parses an argument list into positional arguments and flags
 *
 * @param {string[]} argv - argument list
 * @returns {{flags: string[], args: string[]}} Lists of flags and strings
 *
 * @example
 * const {flags, args} = parseArgs(process.argv.slice(2))
 */
module.exports = function parseArgs(argv) {
  return {
    flags: argv.filter(a => a.startsWith('-')),
    args: argv.filter(a => !a.startsWith('-')),
  }
}
