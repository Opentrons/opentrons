import * as React from 'react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { getRobotStateTimeline } from '../../../file-data/selectors'
import { selectTerminalItem } from '../../../ui/steps/actions/actions'
import { TimelineAlerts } from '../TimelineAlerts'

vi.mock('../../../file-data/selectors')
vi.mock('../../../ui/steps/actions/actions')

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

  it('renders the insufficient tips timeline error and clicking on the button turns it into the starting deck state terminal id ', () => {
    render()
    screen.getByText('Not enough tips to complete action')
    screen.getByText('Add another tip rack to an empty slot in')
    fireEvent.click(screen.getByText('Starting Deck State'))
    expect(vi.mocked(selectTerminalItem)).toHaveBeenCalled()
  })
  it('renders the no tip on pipette timeline error and the knowledge link', () => {
    vi.mocked(getRobotStateTimeline).mockReturnValue({
      timeline: {} as any,
      errors: [{ message: 'mockMessage', type: 'NO_TIP_ON_PIPETTE' }],
    })
    render()
    screen.getByText('No tip on pipette at the start of step')
    screen.getByText('Air gap dispense setting')
  })
})
