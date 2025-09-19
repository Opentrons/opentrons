const UI_PATH_FRAGMENTS = [
  '/organisms/',
  '/molecules/',
  '/atoms/',
  '/pages/',
  '/App/',
  '/DesignTokens/',
]

const isUI = path =>
  UI_PATH_FRAGMENTS.reduce(
    (isUI, pathFragment) => (isUI |= path.includes(pathFragment)),
    false
  )

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
      if (
        context.physicalFilename.includes('/ODD/') ||
        context.physicalFilename.includes('OnDeviceDisplayApp')
      ) {
        if (node.source.value.includes('/Desktop/')) {
          context.report({
            messageId: 'avoidImportingDesktopFromODD',
            node,
          })
        }
      } else if (
        context.physicalFilename.includes('/Desktop/') ||
        context.physicalFilename.includes('DesktopApp')
      ) {
        if (node.source.value.includes('/ODD/')) {
          context.report({
            messageId: 'avoidImportingODDFromDesktop',
            node,
          })
        }
      } else if (!isUI(context.physicalFilename)) {
        if (isUI(node.source.value)) {
          context.report({ messageId: 'avoidImportingUIFromUtils', node })
        }
      } else if (isUI(context.physicalFilename)) {
        if (node.source.value.includes('/Desktop/')) {
          context.report({ messageId: 'avoidImportingDesktopFromShared', node })
        } else if (node.source.value.includes('/ODD/')) {
          context.report({ messageId: 'avoidImportingODDFromShared', node })
        }
      }
    },
  }),
}
