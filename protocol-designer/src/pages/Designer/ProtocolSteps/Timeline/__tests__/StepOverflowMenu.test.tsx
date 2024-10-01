import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { duplicateStep } from '../../../../../ui/steps/actions/thunks'
import { StepOverflowMenu } from '../StepOverflowMenu'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
  getSavedStepForms,
  getUnsavedForm,
} from '../../../../../step-forms/selectors'
import {
  hoverOnStep,
  toggleViewSubstep,
} from '../../../../../ui/steps/actions/actions'
import type * as React from 'react'
import type * as OpentronsComponents from '@opentrons/components'

const mockConfirm = vi.fn()
const mockCancel = vi.fn()

vi.mock('../../../../../step-forms/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
vi.mock('../../../../../ui/steps/actions/thunks')
vi.mock('../../../../../steplist/actions')
vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof OpentronsComponents>()
  return {
    ...actual,
    useConditionalConfirm: vi.fn(() => ({
      confirm: mockConfirm,
      showConfirmation: true,
      cancel: mockCancel,
    })),
  }
})
const render = (props: React.ComponentProps<typeof StepOverflowMenu>) => {
  return renderWithProviders(<StepOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const moveLiquidStepId = 'mockId'
describe('StepOverflowMenu', () => {
  let props: React.ComponentProps<typeof StepOverflowMenu>

  beforeEach(() => {
    props = {
      stepId: moveLiquidStepId,
      top: 0,
      menuRootRef: { current: null },
      setStepOverflowMenu: vi.fn(),
    }
    vi.mocked(getCurrentFormIsPresaved).mockReturnValue(false)
    vi.mocked(getCurrentFormHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getUnsavedForm).mockReturnValue(null)
    vi.mocked(getSavedStepForms).mockReturnValue({
      [moveLiquidStepId]: {
        stepType: 'moveLiquid',
        id: moveLiquidStepId,
      },
    })
  })

  it('renders each button and clicking them calls the action', () => {
    render(props)
    fireEvent.click(screen.getAllByText('Delete step')[0])
    screen.getByText('Are you sure you want to delete this step?')
    fireEvent.click(screen.getByText('delete step'))
    expect(mockConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Duplicate step'))
    expect(vi.mocked(duplicateStep)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Edit step'))
    expect(mockConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('View details'))
    expect(vi.mocked(hoverOnStep)).toHaveBeenCalled()
    expect(vi.mocked(toggleViewSubstep)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Rename step'))
  })
})
