'use strict'

const Z_INDEX_NAME = /^(?:z-index|zIndex(?:[A-Z].*)?)$/
const NUMERIC_VALUE = /^-?\d+(?:\.\d+)?$/
const CSS_Z_INDEX_LITERAL = /z-index\s*:\s*-?\d+(?:\.\d+)?/i
const CSS_Z_INDEX_BEFORE_INTERPOLATION = /z-index\s*:\s*$/i

/**
 * @param {string | null | undefined} name
 * @returns {boolean}
 */
function isZIndexName(name) {
  return typeof name === 'string' && Z_INDEX_NAME.test(name)
}

/**
 * @param {import('estree').Node | null | undefined} key
 * @param {boolean} computed
 * @returns {string | null}
 */
function getPropertyName(key, computed) {
  if (key == null) return null
  if (!computed && key.type === 'Identifier') return key.name
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
  return null
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNumericZIndex(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return NUMERIC_VALUE.test(value.trim())
  return false
}

/**
 * A value written directly at the z-index site, rather than a Z_INDEX token,
 * CSS variable, or other expression.
 *
 * @param {import('estree').Node | null | undefined} node
 * @returns {boolean}
 */
function isHardcodedZIndexValue(node) {
  if (node == null) return false
  if (node.type === 'Literal') return isNumericZIndex(node.value)
  if (
    node.type === 'UnaryExpression' &&
    (node.operator === '-' || node.operator === '+') &&
    node.argument.type === 'Literal'
  ) {
    return typeof node.argument.value === 'number'
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    const text = node.quasis.map(quasi => quasi.value.cooked ?? '').join('')
    return NUMERIC_VALUE.test(text.trim())
  }
  return false
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {import('estree').Node} node
 */
function report(context, node) {
  context.report({
    node,
    messageId: 'noHardcodedZIndex',
  })
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded z-index values. Use Z_INDEX from @opentrons/components or a --z-index-* css variable.',
      recommended: false,
    },
    messages: {
      noHardcodedZIndex:
        'Do not hardcode a z-index value. Use a Z_INDEX constant from @opentrons/components, or var(--z-index-*) in CSS.',
    },
    schema: [],
  },
  create(context) {
    return {
      Property(node) {
        const name = getPropertyName(node.key, node.computed)
        if (isZIndexName(name) && isHardcodedZIndexValue(node.value)) {
          report(context, node.value)
        }
      },
      PropertyDefinition(node) {
        const name = getPropertyName(node.key, node.computed)
        if (isZIndexName(name) && isHardcodedZIndexValue(node.value)) {
          report(context, node.value)
        }
      },
      JSXAttribute(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          !isZIndexName(node.name.name)
        ) {
          return
        }
        if (node.value == null) return
        if (
          node.value.type === 'Literal' &&
          isNumericZIndex(node.value.value)
        ) {
          report(context, node.value)
          return
        }
        if (
          node.value.type === 'JSXExpressionContainer' &&
          isHardcodedZIndexValue(node.value.expression)
        ) {
          report(context, node.value.expression)
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          isZIndexName(node.id.name) &&
          isHardcodedZIndexValue(node.init)
        ) {
          report(context, node.init)
        }
      },
      AssignmentPattern(node) {
        if (
          node.left.type === 'Identifier' &&
          isZIndexName(node.left.name) &&
          isHardcodedZIndexValue(node.right)
        ) {
          report(context, node.right)
        }
      },
      AssignmentExpression(node) {
        if (node.left.type === 'Identifier' && isZIndexName(node.left.name)) {
          if (isHardcodedZIndexValue(node.right)) report(context, node.right)
          return
        }
        if (node.left.type !== 'MemberExpression') return
        const name = getPropertyName(node.left.property, node.left.computed)
        if (isZIndexName(name) && isHardcodedZIndexValue(node.right)) {
          report(context, node.right)
        }
      },
      TemplateLiteral(node) {
        node.quasis.forEach((quasi, index) => {
          if (CSS_Z_INDEX_LITERAL.test(quasi.value.raw)) {
            report(context, quasi)
          }
          const next = node.expressions[index]
          if (
            next != null &&
            CSS_Z_INDEX_BEFORE_INTERPOLATION.test(quasi.value.raw) &&
            isHardcodedZIndexValue(next)
          ) {
            report(context, next)
          }
        })
      },
    }
  },
}
