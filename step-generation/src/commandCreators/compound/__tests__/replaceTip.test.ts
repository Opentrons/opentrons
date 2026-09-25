import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  A1_NOZZLE,
  A12_NOZZLE,
  ALL,
  COLUMN,
  fixture96Plate,
  fixtureTiprack300ul,
  fixtureTiprack1000ul,
  getLabwareDefURI,
} from '@opentrons/shared-data'

import { EMPTY, FIXED_TRASH_ID } from '../../../constants'
import {
  configureNozzleLayoutHelper,
  DEFAULT_PIPETTE,
  dropTipHelper,
  dropTipInPlaceHelper,
  getErrorResult,
  getInitialRobotStateStandard,
  getSuccessResult,
  getTipColumn,
  getTiprackTipstate,
  makeContext,
  moveToAddressableAreaHelper,
  pickUpTipHelper,
  PIPETTE_96,
} from '../../../fixtures'
import { replaceTip } from '../replaceTip'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../../../types'

const tiprack1Id = 'tiprack1Id'
const tiprack2Id = 'tiprack2Id'
const tiprack4Id = 'tiprack4Id'
const tiprack5Id = 'tiprack5Id'
const lidId = 'lid1'
const tiprackURI1 = getLabwareDefURI(fixtureTiprack300ul as LabwareDefinition2)
const tiprackURI2 = getLabwareDefURI(fixtureTiprack1000ul as LabwareDefinition2)
const p300SingleId = DEFAULT_PIPETTE
const p300MultiId = 'p300MultiId'
const p100096Id = 'p100096Id'
const wasteChuteId = 'wasteChuteId'
describe('replaceTip', () => {
  let invariantContext: InvariantContext
  let initialRobotState: RobotState
  beforeEach(() => {
    invariantContext = makeContext()
    initialRobotState = getInitialRobotStateStandard(invariantContext)
  })
  describe('replaceTip: single channel', () => {
    it('Single-channel: first tip', () => {
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([pickUpTipHelper(0)])
    })
    it('replace tip but tiprack has a lid', () => {
      initialRobotState = {
        ...initialRobotState,
        labware: {
          [tiprackURI1]: {
            stack: [tiprackURI1, '1'],
          },
          [lidId]: {
            stack: [tiprackURI1, '1'],
            stackedOnNode: { labwareId: tiprackURI1 },
          },
        },
      }
      invariantContext = {
        ...invariantContext,
        labwareEntities: {
          [tiprackURI1]: {
            id: tiprackURI1,
            def: {
              ...fixtureTiprack300ul,
            } as LabwareDefinition2,
            labwareDefURI: 'fixture/fixture_tiprack_300_ul/1',
            pythonName: 'mock_lid_python_name',
          },
          [lidId]: {
            id: lidId,
            def: {
              ...fixture96Plate,
              allowedRoles: ['lid'],
            } as LabwareDefinition2,
            labwareDefURI: 'mockURI',
            pythonName: 'mock_lid_python_name',
          },
        },
      }
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialRobotState
      )
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'NEXT_TIPRACK_HAS_LID',
      })
    })
    it('Single-channel: second tip B1', () => {
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        merge({}, initialRobotState, {
          tipState: {
            tipracks: {
              [tiprack1Id]: {
                A1: EMPTY,
              },
            },
            pipettes: {
              p300SingleId: { hasTip: false },
            },
          },
        })
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([pickUpTipHelper(1)])
    })
    it('Single-channel: ninth tip (next column)', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: getTipColumn(1, EMPTY),
          },
          pipettes: {
            p300SingleId: { hasTip: false },
          },
        },
      })
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([pickUpTipHelper('A2')])
    })
    it('Single-channel: pipette already has tip, so tip will be replaced.', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: {
              A1: EMPTY,
            },
          },
          pipettes: {
            p300SingleId: { hasTip: true },
          },
        },
      })
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...dropTipHelper(p300SingleId),
        pickUpTipHelper('B1'),
      ])
    })
    it('96-channel full tip and emits the configure nozzle layout command before picking up tip', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: {
              A1: EMPTY,
              B1: EMPTY,
              C1: EMPTY,
              D1: EMPTY,
              E1: EMPTY,
              F1: EMPTY,
              G1: EMPTY,
              H1: EMPTY,
            },
          },
          pipettes: {
            [PIPETTE_96]: { hasTip: true },
          },
        },
        pipettes: {
          [PIPETTE_96]: { nozzles: 'ALL' },
        },
      })
      const result = replaceTip(
        {
          pipette: PIPETTE_96,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          nozzles: COLUMN,
          primaryNozzle: A12_NOZZLE,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...dropTipHelper(PIPETTE_96),
        {
          commandType: 'configureNozzleLayout',
          key: expect.any(String),
          params: {
            pipetteId: PIPETTE_96,
            configurationParams: {
              primaryNozzle: 'A12',
              style: COLUMN,
            },
          },
        },
        pickUpTipHelper('A2', { pipetteId: PIPETTE_96 }),
      ])
    })
    it('Single-channel: used all tips in first rack, move to second rack', () => {
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: getTiprackTipstate(false),
          },
          pipettes: {
            p300SingleId: { hasTip: false },
          },
        },
      })
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        pickUpTipHelper('A1', {
          labwareId: tiprack2Id,
        }),
      ])
    })
    it('Single-channel: dropping tips in waste chute', () => {
      invariantContext = {
        ...invariantContext,
        wasteChuteEntities: {
          wasteChuteId: {
            pythonName: 'waste_chute',
            id: wasteChuteId,
            location: 'cutoutD3',
          },
        },
      }
      const initialTestRobotState = merge({}, initialRobotState, {
        tipState: {
          tipracks: {
            [tiprack1Id]: {
              A1: EMPTY,
            },
          },
          pipettes: {
            p300SingleId: { hasTip: true },
          },
        },
      })
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: 'wasteChuteId',
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        initialTestRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        moveToAddressableAreaHelper(),
        dropTipInPlaceHelper(),
        pickUpTipHelper('B1'),
      ])
    })
    it('Single-channel: no error if pipette does not have tip, and no waste chute or trash bin is found', () => {
      invariantContext = {
        ...invariantContext,
        wasteChuteEntities: {},
        trashBinEntities: {},
      }
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        {
          ...initialRobotState,
          tipState: {
            ...initialRobotState.tipState,
            pipettes: {
              p300SingleId: { hasTip: false, tiprackURI: tiprackURI1 },
            },
          },
        }
      )
      expect(getSuccessResult(result))
    })
    it('Single-channel: error if pipette does have tip, and no waste chute or trash bin is found', () => {
      invariantContext = {
        ...invariantContext,
        wasteChuteEntities: {},
        trashBinEntities: {},
      }
      const result = replaceTip(
        {
          pipette: p300SingleId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        {
          ...initialRobotState,
          tipState: {
            ...initialRobotState.tipState,
            pipettes: {
              p300SingleId: { hasTip: true, tiprackURI: tiprackURI1 },
            },
          },
        }
      )
      expect(getErrorResult(result).errors[0]).toMatchObject({
        type: 'DROP_TIP_LOCATION_DOES_NOT_EXIST',
      })
    })
    it('Single-channel: manual tip selection', () => {
      invariantContext = {
        ...invariantContext,
        wasteChuteEntities: {},
        trashBinEntities: {},
      }
      const result = replaceTip(
        {
          pipette: p300SingleId,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          tipSelectionArgs: {
            tipRackId: tiprack1Id,
            tipWell: 'C5',
          },
        },
        (invariantContext = {
          ...invariantContext,
          wasteChuteEntities: {},
          trashBinEntities: {},
        }),
        initialRobotState
      )
      expect(getSuccessResult(result).commands).toEqual([
        pickUpTipHelper('C5', {
          pipetteId: p300SingleId,
          labwareId: tiprack1Id,
        }),
      ])
    })
  })
  describe('replaceTip: multi-channel', () => {
    it('multi-channel, all tipracks have tips', () => {
      const result = replaceTip(
        {
          pipette: p300MultiId,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,

          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        configureNozzleLayoutHelper(p300MultiId, {
          style: ALL,
          primaryNozzle: A1_NOZZLE,
        }),
        pickUpTipHelper('A1', {
          pipetteId: p300MultiId,
        }),
      ])
    })
    it('multi-channel, missing tip in first row', () => {
      const robotStateWithTipA1Missing = {
        ...initialRobotState,
        tipState: {
          ...initialRobotState.tipState,
          tipracks: {
            [tiprack1Id]: {
              ...getTiprackTipstate(true),
              A1: EMPTY,
            },
            [tiprack2Id]: getTiprackTipstate(true),
          },
        },
      }
      const result = replaceTip(
        {
          pipette: p300MultiId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        robotStateWithTipA1Missing
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        configureNozzleLayoutHelper(p300MultiId, {
          style: ALL,
          primaryNozzle: A1_NOZZLE,
        }),
        pickUpTipHelper('A2', {
          pipetteId: p300MultiId,
        }),
      ])
    })
    it('Multi-channel: pipette already has tip, so tip will be replaced.', () => {
      const robotStateWithTipsOnMulti = {
        ...initialRobotState,
        tipState: {
          ...initialRobotState.tipState,
          pipettes: {
            p300MultiId: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
          },
        },
      }
      const result = replaceTip(
        {
          pipette: p300MultiId,
          dropTipLocation: FIXED_TRASH_ID,
          tipRack: tiprackURI1,
          primaryNozzle: A1_NOZZLE,
          nozzles: ALL,
        },
        invariantContext,
        robotStateWithTipsOnMulti
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        ...dropTipHelper(p300MultiId),
        configureNozzleLayoutHelper(p300MultiId, {
          style: ALL,
          primaryNozzle: A1_NOZZLE,
        }),
        pickUpTipHelper('A1', {
          pipetteId: p300MultiId,
        }),
      ])
    })
  })
  describe('replaceTip: 96-channel', () => {
    it('96-channel, dropping 1 column of tips in waste chute', () => {
      invariantContext = {
        ...invariantContext,

        wasteChuteEntities: {
          wasteChuteId: {
            pythonName: 'waste_chute',
            id: wasteChuteId,
            location: 'cutoutD3',
          },
        },
      }
      initialRobotState = {
        ...initialRobotState,
        pipettes: {
          p100096Id: { mount: 'left', nozzles: COLUMN, tiprackId: tiprack5Id },
        },
        tipState: {
          tipracks: {
            [tiprack4Id]: getTiprackTipstate(false),
            [tiprack5Id]: getTiprackTipstate(true),
          },
          pipettes: {
            p100096Id: {
              hasTip: true,
              tiprackURI: 'tiprackId',
            },
          },
        },
      }

      const result = replaceTip(
        {
          pipette: p100096Id,
          dropTipLocation: 'wasteChuteId',
          tipRack: tiprackURI2,
          nozzles: COLUMN,
          primaryNozzle: A12_NOZZLE,
        },
        invariantContext,
        initialRobotState
      )
      const res = getSuccessResult(result)
      expect(res.commands).toEqual([
        moveToAddressableAreaHelper({
          pipetteId: p100096Id,
          addressableAreaName: '96ChannelWasteChute',
        }),
        dropTipInPlaceHelper({ pipetteId: p100096Id }),
        pickUpTipHelper('A1', {
          pipetteId: p100096Id,
          labwareId: tiprack5Id,
        }),
      ])
    })
  })
})
