// @flow
const NumberType = {
  type: 'number'
}

const PositiveNumber = {
  type: 'number',
  minimum: 0
}

const LabwareFormats = [
  '96-standard',
  '384-standard',
  'trough',
  'irregular',
  'trash',
  'tiprack-96',
  'tiprack-irregular'
]

const schema = {
  type: 'object',
  required: ['metadata', 'ordering', 'wells'],
  additionalProperties: false,
  properties: {

    metadata: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {type: 'string'},

        'display-name': {type: 'string'},
        'display-category': {type: 'string'},
        'tip-volume': PositiveNumber,
        format: {enum: LabwareFormats}
      }
    },
    ordering: {
      type: 'array',
      items: {
        type: 'array',
        items: {type: 'string'}
      }
    },
    wells: {
      type: 'object',
      patternProperties: {
        '.*': { // TODO: use ^[A-Z]+[1-9]+[0-9]*$ (eg A1, AB16, not A03) -- but make sure invalid well keys fail instead of slip past
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
            'total-liquid-volume': PositiveNumber
          }
        }
      }
    }
  }
}

export default schema
