import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../../assets/localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getUnsavedForm } from '../../../../step-forms/selectors'
import { getSelectedSubstep } from '../../../../ui/steps/selectors'
import { getEnableHotKeysDisplay } from '../../../../feature-flags/selectors'
import { DeckSetupContainer } from '../../DeckSetup'
import { OffDeck } from '../../Offdeck'
import { ProtocolSteps } from '..'
import { SubstepsToolbox, TimelineToolbox } from '../Timeline'

vi.mock('../../Offdeck')
vi.mock('../../../../step-forms/selectors')
vi.mock('../../../../ui/steps/selectors')
vi.mock('../../../../ui/labware/selectors')
vi.mock('../StepForm')
vi.mock('../../DeckSetup')
vi.mock('../Timeline')
vi.mock('../../../../feature-flags/selectors')

const render = () => {
  return renderWithProviders(<ProtocolSteps />, {
    i18nInstance: i18n,
  })[0]
}

describe('ProtocolSteps', () => {
  beforeEach(() => {
    vi.mocked(TimelineToolbox).mockReturnValue(<div>mock TimelineToolbox</div>)
    vi.mocked(DeckSetupContainer).mockReturnValue(
      <div>mock DeckSetupContainer</div>
    )
    vi.mocked(OffDeck).mockReturnValue(<div>mock OffDeck</div>)
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(getSelectedSubstep).mockReturnValue(null)
    vi.mocked(SubstepsToolbox).mockReturnValue(<div>mock SubstepsToolbox</div>)
    vi.mocked(getEnableHotKeysDisplay).mockReturnValue(true)
  })

  it('renders each component in ProtocolSteps', () => {
    render()
    screen.debug()
    screen.getByText('mock TimelineToolbox')
    screen.getByText('mock DeckSetupContainer')
  })

  it('renders the toggle when formData is null', () => {
    render()
    screen.getByText('mock DeckSetupContainer')
    fireEvent.click(screen.getByText('Off-deck'))
    screen.getByText('mock OffDeck')
  })

  it('renders no toggle when formData does not equal moveLabware type', () => {
    vi.mocked(getUnsavedForm).mockReturnValue({
      stepType: 'magnet',
      id: 'mockId',
    })
    render()
    expect(screen.queryByText('Off-deck')).not.toBeInTheDocument()
  })

  it('renders the substepToolbox when selectedSubstep is not null', () => {
    vi.mocked(getSelectedSubstep).mockReturnValue('mockId')
    render()
    screen.getByText('mock SubstepsToolbox')
  })

  it('renders the hot keys display', () => {
    render()
    screen.getByText('Double-click to edit')
    screen.getByText('Shift + Click to select all')
    screen.getByText('Command + Click for multi-select')
  })
})
