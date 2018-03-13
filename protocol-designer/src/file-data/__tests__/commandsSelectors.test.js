// @flow
import {getLabwareLiquidState} from '../selectors'

// TODO Ian 2018-03-09 copied from labware-ingred selectors,
// you should export fixures for each labwareState & ingredLocs
// then import here instead of copy-paste
const labwareState = {
  'default-trash': {
    type: 'trash-box',
    name: 'Trash',
    slot: '12'
  },
  container1Id: {
    slot: '10',
    type: '96-flat',
    name: 'Labware 1'
  },
  container2Id: {
    slot: '8',
    type: '96-deep-well',
    name: 'Labware 2'
  },
  container3Id: {
    slot: '9',
    type: 'tube-rack-2ml',
    name: 'Labware 3'
  }
}

const ingredLocs = {
  '0': {
    container1Id: {
      A1: {volume: 100},
      B1: {volume: 150}
    },
    container2Id: {
      A2: {volume: 105},
      B2: {volume: 155}
    }
  },
  '1': {
    container2Id: {
      A2: {volume: 115}, // added this, no longer exactly matching copy
      H1: {volume: 111}
    },
    container3Id: {
      H2: {volume: 222}
    }
  }
}

describe('getLabwareLiquidState', () => {
  test('no liquids', () => {
    expect(getLabwareLiquidState.resultFunc(
      {},
      {}
    )).toEqual({})
  })

  test('selects liquids with multiple ingredient groups & multiple labware', () => {
    expect(getLabwareLiquidState.resultFunc(
      labwareState,
      ingredLocs
    )).toEqual({
      container1Id: {
        A1: {
          '0': {volume: 100}
        },
        B1: {
          '0': {volume: 150}
        }
      },
      container2Id: {
        A2: {
          '0': {volume: 105},
          '1': {volume: 115}
        },
        B2: {
          '0': {volume: 155}
        },
        H1: {
          '1': {volume: 111}
        }
      },
      container3Id: {
        H2: {
          '1': {volume: 222}
        }
      },
      'default-trash': {}
    })
  })
})
