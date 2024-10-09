module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prevents imports of pages from organisms, organisms from molecules, and molecules from atoms in the app',
    },
    messages: {
      avoidImportingPagesFromOrganisms: 'Avoid importing pages from organisms',
      avoidImportingPagesFromMolecules: 'Avoid importing pages from molecules',
      avoidImportingOrganismsFromMolecules:
        'Avoid importing organisms from molecules',
      avoidImportingPagesFromAtoms: 'Avoid importing pages from atoms',
      avoidImportingOrganismsFromAtoms: 'Avoid importing organisms from atoms',
      avoidImportingMoleculesFromAtoms: 'Avoid importing organisms from atoms',
    },
  },
  create: context => ({
    ImportDeclaration: node => {
      if (context.physicalFilename.includes('/organisms/')) {
        if (node.source.value.includes('/pages/')) {
          context.report({
            messageId: 'avoidImportingPagesFromOrganisms',
            node,
          })
        }
      } else if (context.physicalFilename.includes('/molecules/')) {
        if (node.source.value.includes('/pages/')) {
          context.report({
            messageId: 'avoidImportingPagesFromMolecules',
            node,
          })
        } else if (node.source.value.includes('/organisms/')) {
          context.report({
            messageId: 'avoidImportingOrganismsFromMolecules',
            node,
          })
        }
      } else if (context.physicalFilename.includes('/atoms/')) {
        if (node.source.value.includes('/pages/')) {
          context.report({ messageId: 'avoidImportingPagesFromAtoms', node })
        } else if (node.source.value.includes('/organisms/')) {
          context.report({
            messageId: 'avoidImportingOrganismsFromAtoms',
            node,
          })
        } else if (node.source.value.includes('/molecules/')) {
          context.report({
            messageId: 'avoidImportingMoleculesFromAtoms',
            node,
          })
        }
      }
    },
  }),
}
