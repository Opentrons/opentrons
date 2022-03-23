import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import { getPipetteNameSpecs } from '@opentrons/shared-data'
import _tiprack10ul from '@opentrons/shared-data/labware/definitions/2/opentrons_96_tiprack_10ul/1.json'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'

import {
  mockPipetteOffsetCalibration1,
  mockPipetteOffsetCalibration2,
} from '../../../../redux/calibration/pipette-offset/__fixtures__'
import {
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
} from '../../../../redux/calibration/tip-length/__fixtures__'
import {
  mockLeftProtoPipette,
  mockRightProtoPipette,
} from '../../../../redux/pipettes/__fixtures__'
import {
  useAttachedPipetteCalibrations,
  useAttachedPipettes,
  useTipLengthCalibrations,
  useProtocolDetailsForRun,
  useRunPipetteInfoByMount,
} from '..'

import type {
  LabwareDefinition2,
  PipetteNameSpecs,
  ProtocolAnalysisFile,
} from '@opentrons/shared-data'
import type { PipetteInfo, ProtocolDetails } from '..'

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getPipetteNameSpecs: jest.fn(),
  }
})
jest.mock('../useAttachedPipetteCalibrations')
jest.mock('../useAttachedPipettes')
jest.mock('../useTipLengthCalibrations')
jest.mock('../useProtocolDetailsForRun')

const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
>
const mockUseAttachedPipetteCalibrations = useAttachedPipetteCalibrations as jest.MockedFunction<
  typeof useAttachedPipetteCalibrations
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockUseTipLengthCalibrations = useTipLengthCalibrations as jest.MockedFunction<
  typeof useTipLengthCalibrations
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>

const PIPETTE_CALIBRATIONS = {
  left: {
    offset: mockPipetteOffsetCalibration1,
    tipLength: mockTipLengthCalibration1,
  },
  right: {
    offset: mockPipetteOffsetCalibration2,
    tipLength: mockTipLengthCalibration2,
  },
}

const ATTACHED_PIPETTES = {
  left: mockLeftProtoPipette,
  right: mockRightProtoPipette,
}

const TIP_LENGTH_CALIBRATIONS = [
  mockTipLengthCalibration1,
  mockTipLengthCalibration2,
]

const tiprack10ul = _tiprack10ul as LabwareDefinition2
const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolAnalysisFile<{}>

const PROTOCOL_DETAILS = {
  displayName: 'fake protocol',
  protocolData: simpleV6Protocol,
}

describe('useRunPipetteInfoByMount hook', () => {
  beforeEach(() => {
    when(mockUseAttachedPipetteCalibrations)
      .calledWith('otie')
      .mockReturnValue(PIPETTE_CALIBRATIONS)
    when(mockUseAttachedPipettes)
      .calledWith('otie')
      .mockReturnValue(ATTACHED_PIPETTES)
    when(mockUseTipLengthCalibrations)
      .calledWith('otie')
      .mockReturnValue(TIP_LENGTH_CALIBRATIONS)
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue(PROTOCOL_DETAILS)
    when(mockGetPipetteNameSpecs)
      .calledWith('p10_single')
      .mockReturnValue({
        displayName: 'P10 Single-Channel GEN1',
      } as PipetteNameSpecs)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return empty mounts when protocol details not found', () => {
    when(mockUseProtocolDetailsForRun)
      .calledWith('1')
      .mockReturnValue({} as ProtocolDetails)
    const { result } = renderHook(() => useRunPipetteInfoByMount('otie', '1'))
    expect(result.current).toStrictEqual({
      left: null,
      right: null,
    })
  })

  it('should return run pipette info by mount', () => {
    const { result } = renderHook(() => useRunPipetteInfoByMount('otie', '1'))
    expect(result.current).toStrictEqual({
      left: ({
        id: 'pipetteId',
        name: 'p10_single',
        requestedPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteSpecs: {
          displayName: 'P10 Single-Channel GEN1',
        },
        tipRacksForPipette: [
          {
            displayName: 'Opentrons 96 Tip Rack 10 µL',
            lastModifiedDate: null,
            tipRackDef: tiprack10ul,
          },
        ],
      } as unknown) as PipetteInfo,
      right: null,
    })
  })
})
