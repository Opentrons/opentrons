import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../__testing-utils__'
import { getUnsavedForm } from '../../../../step-forms/selectors'
import { DeckSetupContainer } from '../../DeckSetup'
import { OffDeck } from '../../Offdeck'
import { ProtocolSteps } from '..'
import { TimelineToolbox } from '../Timeline'

vi.mock('../../Offdeck')
vi.mock('../../../../step-forms/selectors')
vi.mock('../StepForm')
vi.mock('../../DeckSetup')
vi.mock('../Timeline')
const render = () => {
  return renderWithProviders(<ProtocolSteps />)[0]
}

describe('ProtocolSteps', () => {
  beforeEach(() => {
    vi.mocked(TimelineToolbox).mockReturnValue(<div>mock TimelineToolbox</div>)
    vi.mocked(DeckSetupContainer).mockReturnValue(
      <div>mock DeckSetupContainer</div>
    )
    vi.mocked(OffDeck).mockReturnValue(<div>mock OffDeck</div>)
    vi.mocked(getUnsavedForm).mockReturnValue(null)
  })

  it('renders each component in ProtocolSteps', () => {
    render()
    screen.getByText('mock TimelineToolbox')
    screen.getByText('mock DeckSetupContainer')
  })

  it('renders the toggle when formData is null', () => {
    render()
    screen.getByText('mock DeckSetupContainer')
    fireEvent.click(screen.getByText('offDeck'))
    screen.getByText('mock OffDeck')
  })

  it('renders no toggle when formData does not equal moveLabware type', () => {
    vi.mocked(getUnsavedForm).mockReturnValue({
      stepType: 'magnet',
      id: 'mockId',
    })
    render()
    expect(screen.queryByText('offDeck')).not.toBeInTheDocument()
  })
})
