import { noop } from 'lodash'
import { getPipetteModelSpecs } from '@opentrons/shared-data'
import * as POCFixtures from '../../calibration/pipette-offset/__fixtures__'
import * as TLCFixtures from '../../calibration/tip-length/__fixtures__'
import * as ProtocolSelectors from '../../protocol/selectors'
import { mockTipRackDefinition } from '../../custom-labware/__fixtures__'
import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'

jest.mock('../../protocol/selectors')

const mockGetProtocolPipetteTipRacks = ProtocolSelectors.getProtocolPipetteTipRacks as jest.MockedFunction<
  typeof ProtocolSelectors.getProtocolPipetteTipRacks
>

interface SelectorSpec {
  name: string
  selector: (state: State, ...rest: any[]) => unknown
  state: State
  args?: any[]
  expected: unknown
  before?: () => unknown
}

const SPECS: SelectorSpec[] = [
  {
    name: 'getAttachedPipettes returns no attached pipettes by default',
    selector: Selectors.getAttachedPipettes,
    state: { pipettes: {} } as any,
    args: ['robotName'],
    expected: { left: null, right: null },
  },
  {
    name: 'getAttachedPipettes returns attached pipettes by mount',
    selector: Selectors.getAttachedPipettes,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockUnattachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
          settingsById: null,
        },
      },
    } as any,
    args: ['robotName'],
    expected: {
      left: null,
      right: {
        ...Fixtures.mockAttachedPipette,
        modelSpecs: getPipetteModelSpecs(
          Fixtures.mockAttachedPipette.model as any
        ),
      },
    },
  },
  {
    name: 'getAttachedPipetteSettings returns pipette settings by mount',
    selector: Selectors.getAttachedPipetteSettings,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockUnattachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
          settingsById: {
            [Fixtures.mockAttachedPipette.id]: Fixtures.mockPipetteSettings,
          },
        },
      },
    } as any,
    args: ['robotName'],
    expected: { left: null, right: Fixtures.mockPipetteSettings.fields },
  },
]

describe('robot api selectors', () => {
  SPECS.forEach(spec => {
    const { name, selector, state, args = [], expected } = spec
    it(name, () => expect(selector(state, ...args)).toEqual(expected))
  })
})

describe('getAttachedPipetteCalibrations', () => {
  it('should get calibrations for attached pipettes if they exist', () => {
    const mockPipetteState: State = {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: {
              ...Fixtures.mockAttachedPipette,
              id: POCFixtures.mockPipetteOffsetCalibration1.pipette,
            },
            right: {
              ...Fixtures.mockAttachedPipette,
              id: POCFixtures.mockPipetteOffsetCalibration2.pipette,
            },
          },
          settingsById: null,
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            POCFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
          tipLengthCalibrations: TLCFixtures.mockAllTipLengthCalibrations,
        },
      },
    } as any

    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({
      left: {
        offset: POCFixtures.mockPipetteOffsetCalibration1,
        tipLength: TLCFixtures.mockTipLengthCalibration1,
      },
      right: {
        offset: POCFixtures.mockPipetteOffsetCalibration2,
        tipLength: TLCFixtures.mockTipLengthCalibration2,
      },
    })
  })
  it('should return empty obj if a pipette is attached but there is no calibration', () => {
    const mockPipetteState: State = {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockAttachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
          settingsById: null,
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations: null,
          labwareCalibrations: null,
          calibrationStatus: null,
          tipLengthCalibrations: null,
        },
      },
    } as any
    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({
      left: { offset: null, tipLength: null },
      right: { offset: null, tipLength: null },
    })
  })
  it('should return empty obj if no pipette is attached', () => {
    const mockPipetteState: State = {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockUnattachedPipette,
            right: Fixtures.mockUnattachedPipette,
          },
          settingsById: null,
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            POCFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
          tipLengthCalibrations: TLCFixtures.mockAllTipLengthCalibrations,
        },
      },
    } as any
    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({
      left: { offset: null, tipLength: null },
      right: { offset: null, tipLength: null },
    })
  })
})

const ProtocolSPECS: SelectorSpec[] = [
  {
    name: 'getProtocolPipetteTipRackCalInfo returns null if none in protocol',
    selector: Selectors.getProtocolPipetteTipRackCalInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockAttachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            POCFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
          tipLengthCalibrations: TLCFixtures.mockAllTipLengthCalibrations,
        },
      },
    } as any,
    args: ['robotName'],
    before: () => {
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: null,
        right: null,
      })
    },
    expected: { left: null, right: null },
  },
  {
    name:
      'getProtocolPipetteTipRackCalInfo returns attached pipette and tiprack calibration data',
    selector: Selectors.getProtocolPipetteTipRackCalInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: {
              ...Fixtures.mockAttachedPipette,
              id: POCFixtures.mockPipetteOffsetCalibration1.pipette,
            },
            right: {
              ...Fixtures.mockAttachedPipette,
              id: POCFixtures.mockPipetteOffsetCalibration2.pipette,
            },
          },
          settingsById: null,
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            POCFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
          tipLengthCalibrations:
            TLCFixtures.mockPipetteMatchTipLengthCalibration,
        },
      },
    } as any,
    args: ['robotName'],
    before: () => {
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: {
          pipetteSpecs: Fixtures.mockP300PipetteSpecs,
          tipRackDefs: [mockTipRackDefinition],
        },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
    expected: {
      left: {
        exactPipetteMatch: 'match',
        pipetteCalDate: '2020-08-30T10:02',
        pipetteDisplayName: 'P300 Single-Channel GEN2',
        tipRacks: [
          {
            displayName: 'Mock TipRack Definition',
            lastModifiedDate: '2020-09-29T13:02',
            tipRackDef: mockTipRackDefinition,
          },
        ],
      },
      right: {
        exactPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteDisplayName: 'Right Pipette',
        tipRacks: [],
      },
    },
  },
  {
    name:
      'getProtocolPipetteTipRackCalInfo returns null calibration data if pipettes do not match',
    selector: Selectors.getProtocolPipetteTipRackCalInfo,
    state: {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: Fixtures.mockAttachedPipette,
            right: Fixtures.mockAttachedPipette,
          },
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            POCFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
          tipLengthCalibrations: TLCFixtures.mockAllTipLengthCalibrations,
        },
      },
    } as any,
    args: ['robotName'],
    before: () => {
      mockGetProtocolPipetteTipRacks.mockReturnValue({
        left: {
          pipetteSpecs: Fixtures.mockLeftSpecs,
          tipRackDefs: [mockTipRackDefinition],
        },
        right: { pipetteSpecs: Fixtures.mockRightSpecs, tipRackDefs: [] },
      })
    },
    expected: {
      left: {
        exactPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteDisplayName: 'Left Pipette',
        tipRacks: [
          {
            displayName: 'Mock TipRack Definition',
            lastModifiedDate: null,
            tipRackDef: mockTipRackDefinition,
          },
        ],
      },
      right: {
        exactPipetteMatch: 'incompatible',
        pipetteCalDate: null,
        pipetteDisplayName: 'Right Pipette',
        tipRacks: [],
      },
    },
  },
]

describe('getProtocolPipetteTipRackCalInfo selector', () => {
  ProtocolSPECS.forEach(spec => {
    const { name, selector, state, args = [], expected, before = noop } = spec
    it(name, () => {
      before()
      expect(selector(state, ...args)).toEqual(expected)
    })
  })
})
