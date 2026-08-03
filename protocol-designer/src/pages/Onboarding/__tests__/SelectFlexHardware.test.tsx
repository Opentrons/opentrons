import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { HardwareConfigurator } from '/protocol-designer/components/organisms/HardwareConfigurator'

import { SelectFlexHardware } from '../SelectFlexHardware'

import type { ComponentProps } from 'react'
import type { WizardTileProps } from '../types'

const mockGoBack = vi.fn()
const mockProceed = vi.fn()
const mockWatch = vi.fn()
const mockSetValue = vi.fn()

vi.mock('/protocol-designer/components/organisms/HardwareConfigurator')

const render = (props: ComponentProps<typeof SelectFlexHardware>) => {
  return renderWithProviders(<SelectFlexHardware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SelectFlexHardware', () => {
  let props: ComponentProps<typeof SelectFlexHardware>

  beforeEach(() => {
    mockWatch.mockImplementation((name: string) => {
      const values = {
        fixtures: {},
        modules: {},
        hasGripper: false,
      }

      return values[name as keyof typeof values]
    })
    vi.mocked(HardwareConfigurator).mockReturnValue(
      <div>mock HardwareConfigurator</div>
    )
    props = {
      ...props,
      goBack: mockGoBack,
      proceed: mockProceed,
      watch: mockWatch,
      setValue: mockSetValue,
    } as WizardTileProps
  })

  it('renders the hardware configurator', () => {
    render(props)
    screen.getByText('Configure your deck hardware')
    screen.getByText(
      'Place the modules and fixtures that you are using for this protocol onto the deck.'
    )
    screen.getByText('mock HardwareConfigurator')
    screen.getByRole('button', { name: 'Confirm' })
    screen.getByRole('button', { name: 'Go back' })
  })

  it('should call mock function when clicking confirm', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mockProceed).toHaveBeenCalled()
  })

  it('should call mock function when clicking go back', () => {
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(mockGoBack).toHaveBeenCalled()
  })
})
