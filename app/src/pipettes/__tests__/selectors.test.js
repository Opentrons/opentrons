// @flow

import { getPipetteModelSpecs } from '@opentrons/shared-data'
import * as Fixtures from '../__fixtures__'
import * as CalibrationFixtures from '../../calibration/pipette-offset/__fixtures__'
import * as Selectors from '../selectors'
import type { State } from '../../types'

type SelectorSpec = {|
  name: string,
  selector: (State, ...Array<any>) => mixed,
  state: $Shape<State>,
  args?: Array<any>,
  expected: mixed,
|}

const SPECS: Array<SelectorSpec> = [
  {
    name: 'getAttachedPipettes returns no attached pipettes by default',
    selector: Selectors.getAttachedPipettes,
    state: { pipettes: {} },
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
    },
    args: ['robotName'],
    expected: {
      left: null,
      right: {
        ...Fixtures.mockAttachedPipette,
        modelSpecs: getPipetteModelSpecs(Fixtures.mockAttachedPipette.model),
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
    },
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
    const mockPipetteState: $Shape<State> = {
      pipettes: {
        robotName: {
          attachedByMount: {
            left: {
              ...Fixtures.mockAttachedPipette,
              id: CalibrationFixtures.mockPipetteOffsetCalibration1.attributes
                  .pipette,
            },
            right: {
              ...Fixtures.mockAttachedPipette,
              id: CalibrationFixtures.mockPipetteOffsetCalibration2.attributes
                  .pipette,
            },
          },
          settingsById: null,
        },
      },
      calibration: {
        robotName: {
          pipetteOffsetCalibrations:
            CalibrationFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
        },
      },
    }

    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({
      left: CalibrationFixtures.mockPipetteOffsetCalibration1.attributes,
      right: CalibrationFixtures.mockPipetteOffsetCalibration2.attributes,
    })
  })
  it('should return null if a pipette is attached but there is no calibration', () => {
    const mockPipetteState: $Shape<State> = {
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
        },
      },
    }
    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({ left: null, right: null })
  })
  it('should return null if no pipette is attached', () => {
    const mockPipetteState: $Shape<State> = {
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
            CalibrationFixtures.mockAllPipetteOffsetsCalibration,
          calibrationStatus: null,
          labwareCalibrations: null,
        },
      },
    }
    expect(
      Selectors.getAttachedPipetteCalibrations(mockPipetteState, 'robotName')
    ).toEqual({ left: null, right: null })
  })
})
