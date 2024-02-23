import * as React from 'react'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { getDevtoolsEnabled, toggleDevtools } from '../../../redux/config'
import { EnableDevTools } from '../EnableDevTools'

jest.mock('../../../redux/config')

const mockGetDevtoolsEnabled = getDevtoolsEnabled as jest.MockedFunction<
  typeof getDevtoolsEnabled
>
const mockToggleDevtools = toggleDevtools as jest.MockedFunction<
  typeof toggleDevtools
>

const render = () => {
  return renderWithProviders(<EnableDevTools />, {
    i18nInstance: i18n,
  })
}

describe('EnableDevTools', () => {
  beforeEach(() => {
    mockGetDevtoolsEnabled.mockReturnValue(true)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text and toggle button', () => {
    render()
    screen.getByText('Developer Tools')
    screen.getByText(
      'Enabling this setting opens Developer Tools on app launch, enables additional logging and gives access to feature flags.'
    )
    screen.getByRole('switch', { name: 'enable_dev_tools' })
  })

  it('should call mock toggleConfigValue when clicking the toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'enable_dev_tools',
    })
    fireEvent.click(toggleButton)
    expect(mockToggleDevtools).toHaveBeenCalled()
  })
})
