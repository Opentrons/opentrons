import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { actions as featureFlagActions } from '/protocol-designer/feature-flags'
import { actions as tutorialActions } from '/protocol-designer/tutorial'

import { UserSettings } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/tutorial')
vi.mock('/protocol-designer/feature-flags')

const render = (props: ComponentProps<typeof UserSettings>) => {
  return renderWithProviders(<UserSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UserSettings', () => {
  let props: ComponentProps<typeof UserSettings>
  beforeEach(() => {
    props = {
      canClearHintDismissals: true,
      flags: {
        OT_PD_ENABLE_HOT_KEYS_DISPLAY: true,
        OT_PD_DISABLE_MODULE_RESTRICTIONS: true,
      },
    }
  })
  it('renders the user settings section', () => {
    render(props)
    screen.getByText('User Settings')
    screen.getByText('Hints')
    screen.getByText('Reset')
    screen.getByText('Show all hints and tips notifications again')
    screen.getByText('Timeline editing guidance')
    screen.getByText(
      'Show information about working with steps next to the protocol timeline'
    )
    screen.getByText('Disable module placement restrictions')
    screen.getByText(
      'Turn off all restrictions on module placement and related pipette crash guidance.'
    )
    expect(screen.getAllByRole('switch').length).toBe(2)
  })

  it('should not reset button if canClearHintDismissals is false', () => {
    props = {
      ...props,
      canClearHintDismissals: false,
    }
    render(props)
    expect(screen.queryByText('Reset')).toBeNull()
    screen.getByText('No hints to restore')
  })

  it('should call mock function when clicking the reset button', () => {
    render(props)
    fireEvent.click(screen.getByText('Reset'))
    expect(vi.mocked(tutorialActions.clearAllHintDismissals)).toHaveBeenCalled()
  })

  it('should call mock function when clicking toggle switches', () => {
    render(props)
    const toggleButtons = screen.getAllByRole('switch')

    fireEvent.click(toggleButtons[0])
    expect(vi.mocked(featureFlagActions.setFeatureFlags)).toHaveBeenCalledWith({
      OT_PD_ENABLE_HOT_KEYS_DISPLAY: false,
    })

    fireEvent.click(toggleButtons[1])
    expect(vi.mocked(featureFlagActions.setFeatureFlags)).toHaveBeenCalledWith({
      OT_PD_DISABLE_MODULE_RESTRICTIONS: false,
    })
  })
})
