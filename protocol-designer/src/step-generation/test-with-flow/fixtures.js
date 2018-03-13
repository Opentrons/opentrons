// @flow
import {tiprackWellNamesFlat} from '../'
import type {RobotState} from '../'

// export const wellNames96 = flatMap(
//   'ABCDEFGH'.split(''),
//   (letter): Array<string> => range(12).map(number => letter + (number + 1))
// )

// Eg {A1: true, B1: true, ...}
export const filledTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: true}),
  {}
)

export const emptyTiprackWells = tiprackWellNamesFlat.reduce(
  (acc, wellName) => ({...acc, [wellName]: false}),
  {}
)

export const p300Single = {
  id: 'p300SingleId',
  mount: 'right',
  maxVolume: 300,
  channels: 1
}

export const p300Multi = {
  id: 'p300MultiId',
  mount: 'left',
  maxVolume: 300,
  channels: 8
}

export const all8ChTipIds = ['0', '1', '2', '3', '4', '5', '6', '7']

export const basicLiquidState = {
  pipettes: {
    p300SingleId: { '0': {} },
    p300MultiId: all8ChTipIds.reduce((acc, tipId) => ({...acc, [tipId]: {}}), {})
  },
  labware: {
    sourcePlateId: {
      A1: {},
      A2: {},
      A3: {},
      A4: {},
      A5: {},
      A6: {},
      A7: {},
      A8: {},
      A9: {},
      A10: {},
      A11: {},
      A12: {}
    },
    destPlateId: tiprackWellNamesFlat.reduce((acc, well) => ({
      // Eg {A1: {}, B1: {}, ...etc}
      [well]: {}
    }), {}),
    trashId: {
      A1: {}
    }
  }
}

export const getBasicRobotState = (): RobotState => ({
  instruments: {
    p300SingleId: p300Single,
    p300MultiId: p300Multi
  },
  labware: {
    tiprack1Id: {
      slot: '7',
      type: 'tiprack-200uL',
      name: 'Tip rack'
    },
    sourcePlateId: {
      slot: '10',
      type: 'trough-12row',
      name: 'Source (Buffer)'
    },
    destPlateId: {
      slot: '11',
      type: '96-flat',
      name: 'Destination Plate'
    },
    trashId: {
      slot: '12',
      type: 'fixed-trash',
      name: 'Trash'
    }
  },

  tipState: {
    tipracks: {
      tiprack1Id: {...filledTiprackWells}
    },
    pipettes: {
      p300SingleId: false,
      p300MultiId: false
    }
  },

  liquidState: basicLiquidState
})
