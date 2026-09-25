import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mockThermocycler } from '@opentrons/api-client'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useModuleCommandAnalytics } from '/app/redux-resources/analytics'

import { ThermocyclerModuleSlideout } from '../ThermocyclerModuleSlideout'

import type { ComponentProps } from 'react'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/analytics')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (props: ComponentProps<typeof ThermocyclerModuleSlideout>) => {
  return renderWithProviders(<ThermocyclerModuleSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ThermocyclerModuleSlideout', () => {
  let props: ComponentProps<typeof ThermocyclerModuleSlideout>
  let mockCreateLiveCommand = vi.fn()
  beforeEach(() => {
    mockCreateLiveCommand = vi.fn()
    mockCreateLiveCommand.mockResolvedValue(null)
    vi.mocked(useCreateLiveCommandMutation).mockReturnValue({
      createLiveCommand: mockCreateLiveCommand,
    } as any)
    vi.mocked(useModuleCommandAnalytics).mockReturnValue({
      reportModuleCommand: vi.fn(),
    } as any)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders correct title and body for Thermocycler Lid temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)

    screen.getByText('Set Lid Temperature for Thermocycler Module GEN1')
    screen.getByText(
      'Pre heat or cool your Thermocycler Lid. Enter a whole number between 37 °C and 110 °C.'
    )
    screen.getByText('Set lid temperature')
    screen.getByText('Confirm')
  })

  it('renders correct title and body for Thermocycler Block Temperature', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)

    screen.getByText('Set Block Temperature for Thermocycler Module GEN1')
    screen.getByText(
      'Pre heat or cool your Thermocycler Block. Enter a whole number between 4 °C and 99 °C.'
    )
    screen.getByText('Set block temperature')
    screen.getByText('Confirm')
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Block', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: false,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)
    const button = screen.getByRole('button', { name: 'Confirm' })
    const input = screen.getByRole('spinbutton', {
      name: 'thermocyclerModuleV1_false',
    })
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetBlockTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the button and it is not clickable until there is something in form field for the TC Lid', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)
    const button = screen.getByRole('button', { name: 'Confirm' })
    const input = screen.getByRole('spinbutton', {
      name: 'thermocyclerModuleV1_true',
    })
    fireEvent.change(input, { target: { value: '45' } })
    expect(button).toBeEnabled()
    fireEvent.click(button)

    expect(mockCreateLiveCommand).toHaveBeenCalledWith({
      command: {
        commandType: 'thermocycler/setTargetLidTemperature',
        params: {
          moduleId: mockThermocycler.id,
          celsius: 45,
        },
      },
    })
    expect(button).not.toBeEnabled()
  })

  it('renders the exit button and when clicked, deletes the value input', () => {
    props = {
      module: mockThermocycler,
      isSecondaryTemp: true,
      isExpanded: true,
      onCloseClick: vi.fn(),
    }
    render(props)
    const button = screen.getByLabelText('exit')
    const input = screen.getByRole('spinbutton', {
      name: 'thermocyclerModuleV1_true',
    })
    fireEvent.change(input, { target: { value: '45' } })
    fireEvent.click(button)

    expect(props.onCloseClick).toHaveBeenCalled()
    expect(input).not.toHaveValue()
  })
})
