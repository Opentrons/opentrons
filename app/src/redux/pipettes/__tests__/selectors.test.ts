import { getPipetteModelSpecs } from '@opentrons/shared-data'
import * as POCFixtures from '../../calibration/pipette-offset/__fixtures__'
import * as TLCFixtures from '../../calibration/tip-length/__fixtures__'
import * as Selectors from '../selectors'
import * as Fixtures from '../__fixtures__'
import type { State } from '../../types'

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
