// @flow
import labwareDefToFields from '../labwareDefToFields'
import fieldsToLabware from '../fieldsToLabware'
import labwareFormSchema from '../labwareFormSchema'
import { DEFAULT_CUSTOM_NAMESPACE } from '@opentrons/shared-data'
import fixture96Plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import fixture12Trough from '@opentrons/shared-data/labware/fixtures/2/fixture_12_trough'

jest.mock('../../definitions')

describe('load and immediately save integrity test', () => {
  const pipetteName = 'P10_Single'
  // include "extraFields" that the user would have to set before being able to save a freshly-loaded definition
  // (without these fields, Yup schema cast would fail)
  const testCases = [
    {
      inputDef: fixture96Plate,
      extraFields: { pipetteName },
    },
    {
      inputDef: fixture12Trough,
      extraFields: { pipetteName },
    },
  ]
  testCases.forEach(({ inputDef, extraFields }) => {
    test(inputDef.parameters.loadName, () => {
      const rawFieldValues = {
        ...labwareDefToFields(inputDef),
        ...extraFields,
      }
      const processedFieldValues = labwareFormSchema.cast(rawFieldValues)
      const outputDef = fieldsToLabware(processedFieldValues)

      // We need to compensate for acceptable differences btw input def & output def.
      // Labware Creator...
      //   - does not save all original metadata fields, eg `metadata.tags`,
      //   - may set some fields to a fixed default value, eg namespace and displayVolumeUnits
      //   - may save empty arrays where original def had `undefined`s (brandId, quirks)
      //   - will include all possible `groups` properties, which input does not always have (fixtures should, though)
      const tweakedInputDef = {
        ...inputDef,
        brand: {
          ...inputDef.brand,
          brandId: inputDef.brand.brandId || [],
        },
        parameters: {
          ...inputDef.parameters,
          format: 'irregular', // 'format' use is deprecated, LC always uses 'irregular'
          quirks: inputDef.parameters.quirks || [],
        },
        metadata: {
          ...inputDef.metadata,
          tags: [], // specifying this is not yet supported
          displayVolumeUnits: 'µL', // specifying this is not yet supported
        },
        namespace: DEFAULT_CUSTOM_NAMESPACE, // specifying this is not yet supported
      }

      expect(outputDef).toEqual(tweakedInputDef)
    })
  })
})
