'use strict'

const {
  exports: MUTATING_API_CLIENT_EXPORTS,
} = require('../mutating-api-client-exports.json')

const MUTATING_EXPORT_SET = new Set(MUTATING_API_CLIENT_EXPORTS)
const API_CLIENT_PACKAGE = '@opentrons/api-client'

/**
 * Track local bindings imported from @opentrons/api-client that are mutating
 * HTTP helpers (POST / PUT / PATCH / DELETE), and report CallExpressions that use them.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling mutating @opentrons/api-client helpers (POST/PUT/PATCH/DELETE) directly from app. Use @opentrons/react-api-client mutations instead.',
      recommended: false,
    },
    messages: {
      noDirectMutatingCall:
        "Do not call mutating api-client helper '{{name}}' directly in app. Use an @opentrons/react-api-client mutation instead.",
    },
    schema: [],
  },
  create(context) {
    /** @type {Map<string, string>} localName -> exportedName */
    const bannedLocals = new Map()
    /** @type {Set<string>} */
    const bannedNamespaces = new Set()

    function isApiClientSource(source) {
      return source === API_CLIENT_PACKAGE
    }

    return {
      ImportDeclaration(node) {
        if (
          node.importKind === 'type' ||
          !isApiClientSource(node.source.value)
        ) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            bannedNamespaces.add(specifier.local.name)
            continue
          }

          if (specifier.type !== 'ImportSpecifier') {
            continue
          }
          if (specifier.importKind === 'type') {
            continue
          }

          const importedName = specifier.imported.name

          if (MUTATING_EXPORT_SET.has(importedName)) {
            bannedLocals.set(specifier.local.name, importedName)
          }
        }
      },

      CallExpression(node) {
        const { callee } = node

        if (callee.type === 'Identifier') {
          const exportedName = bannedLocals.get(callee.name)
          if (exportedName != null) {
            context.report({
              node: callee,
              messageId: 'noDirectMutatingCall',
              data: { name: exportedName },
            })
          }
          return
        }

        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          bannedNamespaces.has(callee.object.name) &&
          callee.property.type === 'Identifier' &&
          MUTATING_EXPORT_SET.has(callee.property.name)
        ) {
          context.report({
            node: callee,
            messageId: 'noDirectMutatingCall',
            data: { name: callee.property.name },
          })
        }
      },
    }
  },
}
