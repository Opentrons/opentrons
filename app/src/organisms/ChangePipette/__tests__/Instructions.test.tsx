import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { LEFT } from '@opentrons/shared-data'
import { fixtureP10Multi } from '@opentrons/shared-data/pipette/fixtures/name'
import { i18n } from '../../../i18n'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { LevelPipette } from '../LevelPipette'
import { Instructions } from '../Instructions'
import { CheckPipettesButton } from '../CheckPipettesButton'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

jest.mock('../CheckPipettesButton')
jest.mock('../LevelPipette')

const mockCheckPipettesButton = CheckPipettesButton as jest.MockedFunction<
  typeof CheckPipettesButton
>
const mockLevelPipette = LevelPipette as jest.MockedFunction<
  typeof LevelPipette
>

const render = (props: React.ComponentProps<typeof Instructions>) => {
  return renderWithProviders(<Instructions {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_ACTUAL_PIPETTE = {
  ...mockPipetteInfo.pipetteSpecs,
  model: 'model',
  tipLength: {
    value: 20,
  },
} as any as PipetteModelSpecs

describe('Instructions', () => {
  let props: React.ComponentProps<typeof Instructions>

  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: null,
      actualPipette: MOCK_ACTUAL_PIPETTE,
      displayCategory: 'GEN1',
      direction: 'detach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 0,
      attachedWrong: false,
    }
    mockCheckPipettesButton.mockReturnValue(
      <div>mock check pipettes button</div>
    )
  })
  it('renders 1st page of the detach pipette flow', () => {
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Loosen the screws')
    getByText(
      'Using a 2.5 mm screwdriver, loosen the three screws on the back of the pipette that is currently attached.'
    )
    getByAltText('detach-left-single-GEN1-screws')
    const goBack = getByRole('button', { name: 'Go back' })
    const cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(cont)
    expect(props.setStepPage).toHaveBeenCalled()
  })

  it('renders 2nd page of the detach pipette flow', () => {
    props = {
      ...props,
      stepPage: 1,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Remove the pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Disconnect the pipette from the robot by pulling the white connector tab.'
    )
    getByAltText('detach-left-single-GEN1-tab')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.setStepPage).toHaveBeenCalled()
    getByText('mock check pipettes button')
  })

  it('renders the attach flow when no pipette is selected', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: null,
      actualPipette: null,
      displayCategory: null,
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 0,
      attachedWrong: false,
    }
    const { getByText, getByRole } = render(props)
    getByText('Choose a pipette to attach')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    expect(screen.queryByText('Continue')).not.toBeInTheDocument()
  })

  it('renders the 1st page of the attach flow when a p10 single gen 1 is selected', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: mockPipetteInfo.pipetteSpecs,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 0,
      attachedWrong: false,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Insert screws')
    getByText(
      'Using a 2.5 mm screwdriver, insert the the three screws on the back of the pipette.'
    )
    getByText(
      'Starting with screw #1, tighten the screws with a clockwise motion.'
    )
    getByAltText('attach-left-single-GEN1-screws')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    const cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)
    expect(props.setStepPage).toHaveBeenCalled()
  })

  it('renders the 2nd page of the attach flow when a p10 single gen 1 is selected', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: mockPipetteInfo.pipetteSpecs,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 1,
      attachedWrong: false,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Attach the pipette')
    getByText(
      'Push in the white connector tab until you feel it plug into the pipette.'
    )
    getByAltText('attach-left-single-GEN1-tab')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.setStepPage).toHaveBeenCalled()
    getByText('mock check pipettes button')
  })

  it('renders the attach flow 1st page when a p10 8 channel is selected', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: fixtureP10Multi,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 0,
      attachedWrong: false,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Insert screws')
    getByText(
      'Using a 2.5 mm screwdriver, insert the the three screws on the back of the pipette.'
    )
    getByText(
      nestedTextMatcher(
        'Starting with screw #1, loosely tighten the screws with a clockwise motion. You will tighten them fully in a later step.'
      )
    )
    getByAltText('attach-left-multi-GEN1-screws')
    const cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)
    expect(props.setStepPage).toHaveBeenCalled()
  })

  it('renders the attach flow 2nd page when a p10 8 channel is selected', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: fixtureP10Multi,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 1,
      attachedWrong: false,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Attach the pipette')
    getByText(
      'Push in the white connector tab until you feel it plug into the pipette.'
    )
    getByAltText('attach-left-multi-GEN1-tab')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.setStepPage).toHaveBeenCalled()
    getByText('mock check pipettes button')
  })

  it('renders the attach flow 2nd page when a p10 8 channel is selected and the pipette is wrong', () => {
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: fixtureP10Multi,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 1,
      attachedWrong: true,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Attach the pipette')
    getByText(
      'Push in the white connector tab until you feel it plug into the pipette.'
    )
    getByAltText('attach-left-multi-GEN1-tab')
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    expect(props.setStepPage).toHaveBeenCalled()
    getByText('mock check pipettes button')
  })

  it('renders the attach flow 3rd page when a p300 8 channel is selected', () => {
    mockLevelPipette.mockReturnValue(<div>mockLevelPipette</div>)
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: fixtureP10Multi,
      actualPipette: fixtureP10Multi as PipetteModelSpecs,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      back: jest.fn(),
      setStepPage: jest.fn(),
      stepPage: 2,
      attachedWrong: false,
    }
    const { getByText } = render(props)
    getByText('mockLevelPipette')
  })
})
