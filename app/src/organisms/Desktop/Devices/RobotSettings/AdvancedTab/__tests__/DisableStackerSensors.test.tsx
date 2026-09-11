import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useDisableStackerSensors } from '/app/resources/robot-settings'

import { DisableStackerSensors } from '../DisableStackerSensors'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/robot-settings')

const mockToggleSensors = vi.fn()
const render = (props: ComponentProps<typeof DisableStackerSensors>) => {
  return renderWithProviders(<DisableStackerSensors {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisableStackerSensors', () => {
  let props: ComponentProps<typeof DisableStackerSensors>

  beforeEach(() => {
    props = {
      isRobotBusy: false,
    }
    vi.mocked(useDisableStackerSensors).mockReturnValue({
      sensorsDisabled: false,
      toggleSensors: mockToggleSensors,
    })
  })

  it('should render text and toggle button', () => {
    render(props)
    screen.getByText('Disable Stacker sensors for labware detection')
    screen.getByText(
      'Applies to x- axis and z-axis for all connected Stackers.'
    )
    expect(screen.getByLabelText('disable_stacker_sensors')).toBeInTheDocument()
  })

  it('should call a mock function when clicking toggle button', () => {
    render(props)
    fireEvent.click(screen.getByLabelText('disable_stacker_sensors'))
    expect(mockToggleSensors).toHaveBeenCalled()
  })

  it('shoud make toggle button disabled when robot is busy', () => {
    props = {
      ...props,
      isRobotBusy: true,
    }
    render(props)
    expect(screen.getByLabelText('disable_stacker_sensors')).toBeDisabled()
  })
})
