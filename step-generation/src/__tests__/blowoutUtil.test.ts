import { beforeEach, describe, expect, it, vi } from 'vitest'

import { blowOutInWell } from '../commandCreators/atomic'
import { blowOutInWasteChute } from '../commandCreators/compound'
import {
  BLOWOUT_FLOW_RATE,
  BLOWOUT_OFFSET_FROM_TOP_MM,
  DEFAULT_PIPETTE,
  DEST_LABWARE,
  getInitialRobotStateStandard,
  makeContext,
  SOURCE_LABWARE,
  TROUGH_LABWARE,
} from '../fixtures'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  mixBlowoutLocationHelper,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '../utils'
import { curryCommandCreator } from '../utils/curryCommandCreator'

import type { BlowoutParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '../types'

vi.mock('../utils/curryCommandCreator')

let blowoutArgs: {
  pipette: BlowoutParams['pipetteId']
  sourceLabwareId: string
  sourceWell: BlowoutParams['wellName']
  destLabwareId: string
  destWell: BlowoutParams['wellName']
  blowoutLocation: string | null | undefined
  flowRate: number
  offsetFromTopMm: number
  invariantContext: InvariantContext
  prevRobotState: RobotState
}
describe('blowoutLocationHelper', () => {
  let invariantContext: InvariantContext

  beforeEach(() => {
    invariantContext = makeContext()

    blowoutArgs = {
      pipette: DEFAULT_PIPETTE,
      sourceLabwareId: SOURCE_LABWARE,
      sourceWell: 'A1',
      destLabwareId: DEST_LABWARE,
      destWell: 'A2',
      flowRate: BLOWOUT_FLOW_RATE,
      offsetFromTopMm: BLOWOUT_OFFSET_FROM_TOP_MM,
      invariantContext,
      blowoutLocation: null,
      prevRobotState: getInitialRobotStateStandard(invariantContext),
    }
    vi.mocked(curryCommandCreator).mockClear()
  })
  it('mixBlowoutLocationHelper curries blowout with source well params', () => {
    mixBlowoutLocationHelper({
      ...blowoutArgs,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(blowOutInWell, {
      pipetteId: blowoutArgs.pipette,
      labwareId: blowoutArgs.sourceLabwareId,
      wellName: blowoutArgs.sourceWell,
      flowRate: blowoutArgs.flowRate,
      wellLocation: {
        origin: 'top',
        offset: {
          z: expect.any(Number),
        },
      },
    })
  })
  it('mixBlowoutLocationHelper curries waste chute commands when there is no well', () => {
    const wasteChuteId = 'wasteChuteId'
    invariantContext = {
      ...invariantContext,
      wasteChuteEntities: {
        [wasteChuteId]: {
          id: wasteChuteId,
          location: 'cutoutD3',
          pythonName: 'mock_waste_chute',
        },
      },
    }
    mixBlowoutLocationHelper({
      ...blowoutArgs,
      destLabwareId: wasteChuteId,
      invariantContext: invariantContext,
      destWell: null,
      blowoutLocation: wasteChuteId,
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(blowOutInWasteChute, {
      pipetteId: blowoutArgs.pipette,
      flowRate: 2.3,
      wasteChuteId,
    })
  })
  it('mixBlowoutLocationHelper curries blowout with dest plate params', () => {
    mixBlowoutLocationHelper({
      ...blowoutArgs,
      blowoutLocation: DEST_WELL_BLOWOUT_DESTINATION,
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(blowOutInWell, {
      pipetteId: blowoutArgs.pipette,
      labwareId: blowoutArgs.destLabwareId,
      wellName: blowoutArgs.destWell,
      flowRate: blowoutArgs.flowRate,
      wellLocation: {
        origin: 'top',
        offset: {
          z: expect.any(Number),
        },
      },
    })
  })
  it('mixBlowoutLocationHelper curries blowout with an arbitrary labware Id', () => {
    mixBlowoutLocationHelper({
      ...blowoutArgs,
      blowoutLocation: TROUGH_LABWARE,
    })
    expect(curryCommandCreator).toHaveBeenCalledWith(blowOutInWell, {
      pipetteId: blowoutArgs.pipette,
      labwareId: TROUGH_LABWARE,
      wellName: 'A1',
      flowRate: blowoutArgs.flowRate,
      wellLocation: {
        origin: 'top',
        offset: {
          z: expect.any(Number),
        },
      },
    })
  })
  it('mixBlowoutLocationHelper returns an empty array if not given a blowoutLocation', () => {
    const result = mixBlowoutLocationHelper({
      ...blowoutArgs,
      blowoutLocation: null,
    })
    expect(curryCommandCreator).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })
})
