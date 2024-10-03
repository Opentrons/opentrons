'use strict'

// import all rules in lib/rules
module.exports.rules = {
  'no-imports-up-the-tree-of-life': require('./rules/no-imports-up-the-tree-of-life'),
  'no-imports-across-applications': require('./rules/no-imports-across-applications'),
}
