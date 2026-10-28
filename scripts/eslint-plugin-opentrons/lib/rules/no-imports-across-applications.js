const path = require('path')

const UI_PATH_FRAGMENTS = [
  '/organisms/',
  '/molecules/',
  '/atoms/',
  '/pages/',
  '/App/',
  '/DesignTokens/',
  '/components/',
]

const isUI = pathStr =>
  UI_PATH_FRAGMENTS.reduce(
    (isUI, pathFragment) => (isUI |= pathStr.includes(pathFragment)),
    false
  )

/**
 * The path of the file relative to eslint's cwd.
 *
 * eslint's cwd is normally the monorepo root, so this should return something like
 * app/src/.../foo.ts.
 */
function getRelativePath(context) {
  const cwd = context.getCwd()
  const physicalFilename = context.physicalFilename
  const relative = path.relative(cwd, physicalFilename)
  return relative
}

/** The desktop/ODD app bootstrap file. It wires global UI styles and keyboards. */
function isAppEntry(relativePath) {
  return (
    relativePath === 'app/src/index.tsx' ||
    relativePath.endsWith('/app/src/index.tsx')
  )
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevents imports of desktop from ODD and such',
    },
    messages: {
      avoidImportingDesktopFromODD: 'Avoid importing desktop from ODD',
      avoidImportingDesktopFromShared:
        'Avoid importing desktop from shared structures',
      avoidImportingODDFromDesktop: 'Avoid importing ODD from desktop',
      avoidImportingODDFromShared: 'Avoid importing ODD from shared structures',
      avoidImportingUIFromUtils: 'Avoid importing UI code from utility code',
    },
  },
  create: context => ({
    ImportDeclaration: node => {
      const relativePath = getRelativePath(context)
      if (
        relativePath.includes('/ODD/') ||
        relativePath.includes('OnDeviceDisplayApp')
      ) {
        if (node.source.value.includes('/Desktop/')) {
          context.report({
            messageId: 'avoidImportingDesktopFromODD',
            node,
          })
        }
      } else if (
        relativePath.includes('/Desktop/') ||
        relativePath.includes('DesktopApp') ||
        relativePath.includes('/desktop/')
      ) {
        if (node.source.value.includes('/ODD/')) {
          context.report({
            messageId: 'avoidImportingODDFromDesktop',
            node,
          })
        }
      } else if (!isUI(relativePath) && !isAppEntry(relativePath)) {
        if (isUI(node.source.value)) {
          context.report({ messageId: 'avoidImportingUIFromUtils', node })
        }
      } else if (isUI(relativePath)) {
        if (node.source.value.includes('/Desktop/')) {
          context.report({ messageId: 'avoidImportingDesktopFromShared', node })
        } else if (
          node.source.value.includes('/ODD/') &&
          !node.source.value.includes('/components')
        ) {
          context.report({ messageId: 'avoidImportingODDFromShared', node })
        }
      }
    },
  }),
}
