// @flow
const NumberType = {
  type: 'number',
}

const PositiveNumber = {
  type: 'number',
  minimum: 0,
}

const LabwareFormats = ['96-standard', '384-standard', 'trough', 'irregular']

// TODO IMMEDIATELY move to labware/flowTypes/
// TODO(mc, 2020-02-21) move to labware/schemas/1.json? delete?
// this only appears to be used in a single test file
// shared-data/js/__tests__/labwareDefSchemaV1.test.js
export const labwareSchemaV1 = {
  type: 'object',
  required: ['metadata', 'ordering', 'wells'],
  additionalProperties: false,
  properties: {
    metadata: {
      type: 'object',
      required: ['name', 'format'],
      properties: {
        name: { type: 'string' },
        format: { enum: LabwareFormats },

        deprecated: { enum: [true] },
        displayName: { type: 'string' },
        displayCategory: { type: 'string' },
        isValidSource: { enum: [false] },
        isTiprack: { enum: [true] },
        tipVolume: PositiveNumber,
      },
    },
    ordering: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    wells: {
      type: 'object',
      patternProperties: {
        '.*': {
          // TODO: use ^[A-Z]+[1-9]+[0-9]*$ (eg A1, AB16, not A03) -- but make sure invalid well keys fail instead of slip past
          type: 'object',
          required: ['height', 'length', 'width', 'x', 'y', 'z'],
          properties: {
            height: NumberType,
            length: PositiveNumber,
            width: PositiveNumber,
            x: NumberType,
            y: NumberType,
            z: NumberType,

            // Optional
            diameter: PositiveNumber, // NOTE: presence of diameter indicates a circular well
            depth: PositiveNumber, // TODO Ian 2018-03-12: depth should be required, but is missing in MALDI-plate
            'total-liquid-volume': PositiveNumber,
          },
        },
      },
    },
  },
}
