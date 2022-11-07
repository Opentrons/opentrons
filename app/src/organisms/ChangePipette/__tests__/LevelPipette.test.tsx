import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { LevelPipette } from '../LevelPipette'

import type { PipetteName, PipetteNameSpecs } from '@opentrons/shared-data'

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
} as PipetteNameSpecs & {name: PipetteName}

describe('LevelPipette', () => {
  let props: React.ComponentProps<typeof LevelPipette>

  beforeEach(() => {
    props = {
      mount: LEFT,
      pipetteModelName: MOCK_WANTED_PIPETTE.name,
      back: jest.fn(),
      confirm: jest.fn(),
    }
  })

  it('renders title and description', () => {
    const { getByText } = render(props)
    getByText(nestedTextMatcher('Level the pipette'))
    getByText(
      nestedTextMatcher(
        'Using your hand, gently and slowly push the pipette up.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Place the calibration block in slot 1/3 with the tall/short surface on the left/right side.'
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
    const cont = getByRole('button', { name: 'Confirm level' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(cont)
    expect(props.confirm).toHaveBeenCalled()
  })
})
