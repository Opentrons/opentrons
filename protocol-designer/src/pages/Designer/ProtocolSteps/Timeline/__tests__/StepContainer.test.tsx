import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../assets/localization'
import { getUnsavedForm } from '../../../../../step-forms/selectors'
import { StepContainer } from '../StepContainer'
import { StepOverflowMenu } from '../StepOverflowMenu'

vi.mock('../../../../../step-forms/selectors')
vi.mock('../StepOverflowMenu')

const render = (props: React.ComponentProps<typeof StepContainer>) => {
  return renderWithProviders(<StepContainer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StepContainer', () => {
  let props: React.ComponentProps<typeof StepContainer>

  beforeEach(() => {
    props = {
      title: 'Starting deck state',
      iconName: 'add',
      onClick: vi.fn(),
      selected: false,
      hovered: false,
      stepId: 'mockStepId',
    }
    vi.mocked(StepOverflowMenu).mockReturnValue(
      <div>mock StepOverflowMenu</div>
    )
    vi.mocked(getUnsavedForm).mockReturnValue(null)
  })

  it('renders the starting deck state step', () => {
    render(props)
    fireEvent.click(screen.getByText('Starting deck state'))
    expect(props.onClick).toHaveBeenCalled()
  })
  it('renders the ending deck state step', () => {
    props.title = 'Final deck state'
    render(props)
    screen.getByText('Final deck state')
  })
})
