import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { LEFT, PipetteNameSpecs } from '@opentrons/shared-data'
import { LevelPipette } from '../LevelPipette'

const render = (props: React.ComponentProps<typeof LevelPipette>) => {
  return renderWithProviders(<LevelPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_WANTED_PIPETTE = {
  displayName: 'P300 8-Channel GEN2',
  displayCategory: 'GEN2',
  defaultAspirateFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  defaultDispenseFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  defaultBlowOutFlowRate: {
    value: 94,
    min: 1,
    max: 275,
    valuesByApiLevel: {
      '2.0': 94,
    },
  },
  channels: 8,
  minVolume: 20,
  maxVolume: 300,
  smoothieConfigs: {
    stepsPerMM: 3200,
    homePosition: 155.75,
    travelDistance: 60,
  },
  defaultTipracks: [
    'opentrons/opentrons_96_tiprack_300ul/1',
    'opentrons/opentrons_96_filtertiprack_200ul/1',
  ],
  name: 'p300_multi_gen2',
} as PipetteNameSpecs

describe('LevelPipette', () => {
  let props: React.ComponentProps<typeof LevelPipette>

  beforeEach(() => {
    props = {
      mount: LEFT,
      wantedPipette: MOCK_WANTED_PIPETTE,
      pipetteModelName: MOCK_WANTED_PIPETTE.name,
      back: jest.fn(),
      exit: jest.fn(),
      confirm: jest.fn(),
      currentStep: 6,
      totalSteps: 8,
    }
  })

  it('renders title and description', () => {
    const { getByText } = render(props)
    getByText('Attach a P300 8-Channel GEN2 Pipette')
    getByText(nestedTextMatcher('Level the pipette'))
    getByText(
      nestedTextMatcher(
        'Using your hand, gently and slowly push the pipette up.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Place the calibration block in slot1/3 with the tall/short surface on the left/right side.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Pull the pipette down so all 8 nozzles touch the surface of the block.'
      )
    )
    getByText(
      nestedTextMatcher(
        'While holding the pipette down, tighten the three screws.'
      )
    )
    getByText(nestedTextMatcher('Gently and slowly push the pipette back up.'))
  })

  it('the CTAs should be clickable', () => {
    const { getByRole } = render(props)
    const goBack = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'Exit' })
    const cont = getByRole('button', { name: 'Confirm level' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.exit).toHaveBeenCalled()
    fireEvent.click(cont)
    expect(props.confirm).toHaveBeenCalled()
  })
})
