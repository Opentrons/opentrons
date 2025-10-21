import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ControlPreferencesSettings } from '../ControlPreferencesSettings'

import type { ControlPreferencesSettingsProps } from '../ControlPreferencesSettings'

const render = (props: ControlPreferencesSettingsProps) => {
  return renderWithProviders(<ControlPreferencesSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ControlPreferencesSettings', () => {
  let mockProps: ControlPreferencesSettingsProps

  beforeEach(() => {
    mockProps = {
      toggleShowControls: vi.fn(),
    }
  })

  it('renders camera controls header', () => {
    render(mockProps)

    screen.getByText('Camera Controls')
  })

  it('renders image and video settings text', () => {
    render(mockProps)

    screen.getByText('Image and video settings')
    screen.getByText(
      'Configure the camera’s zoom, brightness, contrast, and saturation.'
    )
  })

  it('calls toggleShowControls when list button is clicked', () => {
    render(mockProps)

    const listButton = screen.getByTestId('ListButton_noActive')
    fireEvent.click(listButton)

    expect(mockProps.toggleShowControls).toHaveBeenCalledTimes(1)
  })
})
