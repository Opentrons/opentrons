import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { LEFT, PipetteModelSpecs } from '@opentrons/shared-data'
import { fixtureP10Multi } from '@opentrons/shared-data/pipette/fixtures/name'
import { i18n } from '../../../i18n'
import { mockPipetteInfo } from '../../../redux/pipettes/__fixtures__'
import { Instructions } from '../Instructions'
import { CheckPipettesButton } from '../CheckPipettesButton'

jest.mock('../CheckPipettesButton')

const mockCheckPipettesButton = CheckPipettesButton as jest.MockedFunction<
  typeof CheckPipettesButton
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
} as PipetteModelSpecs

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
      exit: jest.fn(),
      back: jest.fn(),
      currentStep: 5,
      totalSteps: 8,
    }
  })
  it('renders the detach flow and buttons work as expected', () => {
    mockCheckPipettesButton.mockReturnValue(
      <div>mock check pipettes button</div>
    )
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Detach P10 Single-Channel from Left Mount')
    getByText('Step: 5 / 8')
    getByText('Loosen the screws')
    getByText(
      'Using a 2.5 mm screwdriver, loosen the three screws on the back of the pipette that is currently attached.'
    )
    getByAltText('detach-left-single-GEN1-screws')
    const goBack = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'Exit' })
    const cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(props.exit).toHaveBeenCalled()
    fireEvent.click(cont)
    getByText('Remove the pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Disconnect the pipette from the robot by pulling the white connector tab.'
    )
    getByAltText('detach-left-single-GEN1-tab')
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
      exit: jest.fn(),
      back: jest.fn(),
      currentStep: 5,
      totalSteps: 8,
    }
    const { getByText, getByRole } = render(props)
    getByText('Attach a pipette')
    getByText('Step: 5 / 8')
    getByText('Choose a pipette to attach')
    const goBack = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    expect(screen.queryByText('Continue')).not.toBeInTheDocument()
  })

  it('renders the attach flow when a p10 single gen 1 is selected', () => {
    mockCheckPipettesButton.mockReturnValue(
      <div>mock check pipettes button</div>
    )
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: mockPipetteInfo.pipetteSpecs,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      exit: jest.fn(),
      back: jest.fn(),
      currentStep: 5,
      totalSteps: 8,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Attach a P10 Single-Channel Pipette')
    getByText('Step: 5 / 8')
    getByText('Insert screws')
    getByText(
      'Using a 2.5 mm screwdriver, insert the the three screws on the back of the pipette.'
    )
    getByText(
      'Starting with screw #1, tighten the screws with a clockwise motion.'
    )
    getByAltText('attach-left-single-GEN1-screws')
    const goBack = getByRole('button', { name: 'Go back' })
    const exit = getByRole('button', { name: 'Exit' })
    fireEvent.click(goBack)
    expect(props.back).toHaveBeenCalled()
    fireEvent.click(exit)
    const cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)
    getByText('Attach the pipette')
    getByText(
      'Push in the white connector tab until you feel it plug into the pipette.'
    )
    getByAltText('attach-left-single-GEN1-tab')
    getByText('mock check pipettes button')
  })

  it('renders the attach flow when a p10 8 channel is selected', () => {
    mockCheckPipettesButton.mockReturnValue(
      <div>mock check pipettes button</div>
    )
    props = {
      robotName: 'otie',
      mount: LEFT,
      wantedPipette: fixtureP10Multi,
      actualPipette: null,
      displayCategory: 'GEN1',
      direction: 'attach',
      setWantedName: jest.fn(),
      confirm: jest.fn(),
      exit: jest.fn(),
      back: jest.fn(),
      currentStep: 5,
      totalSteps: 8,
    }
    const { getByText, getByRole, getByAltText } = render(props)
    getByText('Attach a P10 8-Channel Pipette')
    getByText('Step: 5 / 8')
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
    getByText('Attach the pipette')
    getByText(
      'Push in the white connector tab until you feel it plug into the pipette.'
    )
    getByAltText('attach-left-multi-GEN1-tab')
    getByText('mock check pipettes button')
  })
})
