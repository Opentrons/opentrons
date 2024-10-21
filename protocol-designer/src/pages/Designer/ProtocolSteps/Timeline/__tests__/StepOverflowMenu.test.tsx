import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import {
  getMultiSelectItemIds,
  actions as stepsActions,
} from '../../../../../ui/steps'
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

vi.mock('../../../../../ui/steps')
vi.mock('../../../../../step-forms/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
vi.mock('../../../../../ui/steps/actions/thunks')
vi.mock('../../../../../steplist/actions')
vi.mock('../../../../../feature-flags/selectors')

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
      multiSelectItemIds: [],
      handleEdit: vi.fn(),
      confirmDelete: mockConfirm,
      confirmMultiDelete: vi.fn(),
    }
    vi.mocked(getMultiSelectItemIds).mockReturnValue(null)
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
    fireEvent.click(screen.getByText('Delete step'))
    expect(mockConfirm).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Duplicate step'))
    expect(vi.mocked(stepsActions.duplicateStep)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Edit step'))
    fireEvent.click(screen.getByText('View details'))
    expect(vi.mocked(hoverOnStep)).toHaveBeenCalled()
    expect(vi.mocked(toggleViewSubstep)).toHaveBeenCalled()
  })

  it('renders the multi select overflow menu', () => {
    render({ ...props, multiSelectItemIds: ['abc', '123'] })
    screen.getByText('Duplicate steps')
    screen.getByText('Delete steps')
  })
})
