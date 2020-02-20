import * as selectors from '../'

describe('step form selectors', () => {
  describe('getPipetteDisplayProperties', () => {
    test('pipettes on deck display info is returned', () => {
      const pipettes = {
        id123: {
          id: 'id123',
          mount: 'left',
          spec: {
            displayName: 'left pipette',
          },
        },
        id456: {
          id: 'id456',
          mount: 'right',
          spec: {
            displayName: 'right pipette',
          },
        },
      }

      const result = selectors.getPipetteDisplayProperties.resultFunc({
        labware: {},
        modules: {},
        pipettes,
      })

      expect(result).toEqual({
        id123: {
          id: pipettes.id123.id,
          name: pipettes.id123.spec.displayName,
          mount: pipettes.id123.mount,
        },
        id456: {
          id: pipettes.id456.id,
          name: pipettes.id456.spec.displayName,
          mount: pipettes.id456.mount,
        },
      })
    })
  })
})
