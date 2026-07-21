'use strict'

const ALLOWLISTED_SUFFIX =
  'react-api-client/src/accessControl/useDocumentedMutation.ts'

function isAllowlisted(filename) {
  return filename.replace(/\\/g, '/').endsWith(ALLOWLISTED_SUFFIX)
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct useMutation calls; use useDocumentedMutation instead',
      recommended: false,
    },
    messages: {
      noDirectUseMutation:
        'Directly calling useMutation is deprecated. Use useDocumentedMutation instead to maintain Compliance Ready Software standards.',
    },
    schema: [],
  },
  create(context) {
    if (isAllowlisted(context.physicalFilename)) {
      return {}
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'useMutation'
        ) {
          context.report({
            node: node.callee,
            messageId: 'noDirectUseMutation',
          })
        }
      },
    }
  },
}
