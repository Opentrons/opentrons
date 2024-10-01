import { describe, it, vi, beforeEach, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import {
  getOrderedStepIds,
  getUnsavedForm,
} from '../../../../../step-forms/selectors'
import { TimelineToolbox } from '../TimelineToolbox'
import { TerminalItemStep } from '../TerminalItemStep'
import { DraggableSteps } from '../DraggableSteps'
import { PresavedStep } from '../PresavedStep'
import { AddStepButton } from '../AddStepButton'

vi.mock('../AddStepButton')
vi.mock('../DraggableSteps')
vi.mock('../PresavedStep')
vi.mock('../TerminalItemStep')
vi.mock('../../../../../step-forms/selectors')
const render = () => {
  return renderWithProviders(<TimelineToolbox />, {
    i18nInstance: i18n,
  })[0]
}

describe('TimelineToolbox', () => {
  beforeEach(() => {
    vi.mocked(getOrderedStepIds).mockReturnValue(['mock1Step'])
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(TerminalItemStep).mockReturnValue(
      <div>mock TerminalItemStep</div>
    )
    vi.mocked(DraggableSteps).mockReturnValue(<div>mock DraggableSteps</div>)
    vi.mocked(PresavedStep).mockReturnValue(<div>mock PresavedStep</div>)
    vi.mocked(AddStepButton).mockReturnValue(<div>mock AddStepButton</div>)
  })
  it('renders 2 terminal item steps, a draggable step and presaved step with toolbox title', () => {
    render()
    screen.getByText('Protocol timeline')
    screen.getByText('mock AddStepButton')
    screen.getByText('mock PresavedStep')
    screen.getByText('mock DraggableSteps')
    expect(screen.getAllByText('mock TerminalItemStep')).toHaveLength(2)
  })
})
