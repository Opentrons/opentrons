import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useDisableVacuumModuleWasteDetection } from '/app/resources/robot-settings'

import { DisableVacuumModuleWasteDetection } from '../DisableVacuumModuleWasteDetection'

import type { ComponentProps } from 'react'

vi.mock('/app/resources/robot-settings')

const mockToggleWasteDetection = vi.fn()
const render = (
  props: ComponentProps<typeof DisableVacuumModuleWasteDetection>
) => {
  return renderWithProviders(<DisableVacuumModuleWasteDetection {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisableVacuumModuleWasteDetection', () => {
  let props: ComponentProps<typeof DisableVacuumModuleWasteDetection>

  beforeEach(() => {
    props = {
      isRobotBusy: false,
    }
    vi.mocked(useDisableVacuumModuleWasteDetection).mockReturnValue({
      wasteDetectionDisabled: false,
      toggleWasteDetection: mockToggleWasteDetection,
    })
  })

  it('should render text and toggle button', () => {
    render(props)
    screen.getByText("Disable Vacuum Module's Waste Full Detection")
    screen.getByText("Applies for all connected Vacuum Modules.")
    expect(
      screen.getByLabelText('disable_vacuum_module_waste_detection')
    ).toBeInTheDocument()
  })

  it('should call a mock function when clicking toggle button', () => {
    render(props)
    fireEvent.click(
      screen.getByLabelText('disable_vacuum_module_waste_detection')
    )
    expect(mockToggleWasteDetection).toHaveBeenCalled()
  })

  it('should make toggle button disabled when robot is busy', () => {
    props = {
      ...props,
      isRobotBusy: true,
    }
    render(props)
    expect(
      screen.getByLabelText('disable_vacuum_module_waste_detection')
    ).toBeDisabled()
  })
})
