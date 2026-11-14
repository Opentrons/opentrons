import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getRobotStateTimeline } from '/protocol-designer/file-data/selectors'
import { selectTerminalItem } from '/protocol-designer/ui/steps/actions/actions'

import { TimelineAlerts } from '../TimelineAlerts'

vi.mock('/protocol-designer/file-data/selectors')
vi.mock('/protocol-designer/ui/steps/actions/actions')

const render = () => {
  return renderWithProviders(<TimelineAlerts />, {
    i18nInstance: i18n,
  })[0]
}

describe('TimelineAlerts', () => {
  beforeEach(() => {
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: {} as any,
      errors: [{ message: 'mockMessage', type: 'INSUFFICIENT_TIPS' }],
    })
  })

  it('renders the insufficient tips timeline error and clicking on the button turns it into the starting deck state terminal id ', async () => {
    const user = userEvent.setup()
    render()
    screen.getByText('Not enough accessible tips')
    screen.getByText(
      'Add or move a tip rack on your deck to avoid collisions, or change your tip pickup settings for this action.'
    )
    await user.click(screen.getByText('Edit starting deck'))
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })

  it('renders the no tip on pipette timeline error and the knowledge link', () => {
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: {} as any,
      errors: [{ message: 'mockMessage', type: 'NO_TIP_ON_PIPETTE' }],
    })
    render()
    screen.getByText('No tip on pipette at start of step')
  })
})
