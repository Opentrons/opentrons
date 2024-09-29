import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { deleteStep } from '../../../../../steplist/actions'
import { duplicateStep } from '../../../../../ui/steps/actions/thunks'
import { populateForm } from '../../../../../ui/steps/actions/actions'
import { StepOverflowMenu } from '../StepOverflowMenu'
import {
  getCurrentFormHasUnsavedChanges,
  getCurrentFormIsPresaved,
  getUnsavedForm,
} from '../../../../../step-forms/selectors'
import type * as React from 'react'

vi.mock('../../../../../step-forms/selectors')
vi.mock('../../../../../ui/steps/actions/actions')
vi.mock('../../../../../ui/steps/actions/thunks')
vi.mock('../../../../../steplist/actions')
const render = (props: React.ComponentProps<typeof StepOverflowMenu>) => {
  return renderWithProviders(<StepOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepOverflowMenu', () => {
  let props: React.ComponentProps<typeof StepOverflowMenu>

  beforeEach(() => {
    props = {
      stepId: 'mockId',
      top: 0,
      menuRootRef: { current: null },
      setStepOverflowMenu: vi.fn(),
    }
    vi.mocked(getCurrentFormIsPresaved).mockReturnValue(false)
    vi.mocked(getCurrentFormHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getUnsavedForm).mockReturnValue(null)
  })

  it('renders each button and clicking them calls the action', () => {
    render(props)
    fireEvent.click(screen.getByText('Delete step'))
    expect(vi.mocked(deleteStep)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Duplicate step'))
    expect(vi.mocked(duplicateStep)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Edit step'))
    expect(vi.mocked(populateForm)).toHaveBeenCalled()
    fireEvent.click(screen.getByText('View commands'))
    fireEvent.click(screen.getByText('View step details'))
    //  TODO: wire up view commands and view step details
  })
})
