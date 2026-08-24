import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TouchInputField } from '@opentrons/components'

import { renderWithProviders } from '/app/__testing-utils__'
import { StatelessNumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'

import { getVolumeRange } from '../utils'
import { VolumeEntry } from '../VolumeEntry'

import type { ChangeEvent, ComponentProps } from 'react'
import type * as SoftwareKeyboard from '/app/atoms/SoftwareKeyboard'

vi.mock('/app/atoms/SoftwareKeyboard', async importOriginal => {
  const actual = await importOriginal<typeof SoftwareKeyboard>()
  return {
    ...actual,
    StatelessNumericalKeyboard: vi.fn(),
  }
})
vi.mock('../utils')

vi.mock('@opentrons/components', async importOriginal => {
  const actualComponents = await importOriginal<typeof TouchInputField>()
  return {
    ...actualComponents,
    TouchInputField: vi.fn(),
  }
})

const render = (props: ComponentProps<typeof VolumeEntry>) => {
  return renderWithProviders(<VolumeEntry {...props} />, {
    i18nInstance: i18n,
  })
}

describe('VolumeEntry', () => {
  let props: ComponentProps<typeof VolumeEntry>

  beforeEach(() => {
    props = {
      onNext: vi.fn(),
      onBack: vi.fn(),
      exitButtonProps: {
        buttonType: 'tertiaryLowLight',
        buttonText: 'Exit',
        onClick: vi.fn(),
      },
      state: {
        mount: 'left',
        pipette: {
          channels: 1,
        } as any,
        sourceWells: ['A1'],
        destinationWells: ['A1'],
        transferType: 'transfer',
      },
      dispatch: vi.fn(),
    }
    vi.mocked(getVolumeRange).mockReturnValue({ min: 5, max: 50 })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the volume entry screen, continue, and exit buttons', () => {
    render(props)
    const exitBtn = screen.getByText('Exit')
    fireEvent.click(exitBtn)
    expect(props.exitButtonProps.onClick).toHaveBeenCalled()
    expect(vi.mocked(TouchInputField)).toHaveBeenCalled()
    expect(vi.mocked(StatelessNumericalKeyboard)).toHaveBeenCalled()
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(continueBtn).toBeDisabled()
  })

  it('renders transfer text if there are more destination wells than source wells', () => {
    render(props)
    screen.getByText('Set transfer volume')
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Volume per well (µL)',
        error: null,
        type: 'text',
        value: '',
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('renders dispense text if there are more destination wells than source wells', () => {
    render({
      ...props,
      state: {
        sourceWells: ['A1'],
        destinationWells: ['A1', 'A2'],
        transferType: 'distribute',
      },
    })
    render(props)
    screen.getByText('Set dispense volume')
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Dispense volume per well (µL)',
        error: null,
        type: 'text',
        value: '',
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('renders aspirate text if there are more destination wells than source wells', () => {
    render({
      ...props,
      state: {
        sourceWells: ['A1', 'A2'],
        destinationWells: ['A1'],
        transferType: 'consolidate',
      },
    })
    render(props)
    screen.getByText('Set aspirate volume')
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Aspirate volume per well (µL)',
        error: null,
        type: 'text',
        value: '',
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('calls on next and dispatch if you press continue when volume is non-null and within range', () => {
    render({
      ...props,
      state: {
        sourceWells: ['A1', 'A2'],
        destinationWells: ['A1'],
        transferType: 'consolidate',
        volume: 20,
      },
    })
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(continueBtn).toBeEnabled()
    fireEvent.click(continueBtn)
    expect(vi.mocked(props.onNext)).toHaveBeenCalled()
    expect(vi.mocked(props.dispatch)).toHaveBeenCalled()
  })

  it('displays an error and disables continue when volume is outside of range', () => {
    render({
      ...props,
      state: {
        sourceWells: ['A1', 'A2'],
        destinationWells: ['A1'],
        transferType: 'consolidate',
        volume: 90,
      },
    })
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(continueBtn).toBeDisabled()
    expect(vi.mocked(TouchInputField)).toHaveBeenCalledWith(
      {
        autoFocus: true,
        label: 'Aspirate volume per well (µL)',
        error: 'Value must be between 5 to 50',
        type: 'text',
        value: '90',
        onChange: expect.any(Function),
      },
      {}
    )
  })

  it('retains malformed input, shows an error, and disables continue', () => {
    render(props)
    const lastCall = vi.mocked(TouchInputField).mock.calls.at(-1)
    act(() => {
      lastCall?.[0].onChange?.({
        target: { value: '1.' },
      } as ChangeEvent<HTMLInputElement>)
    })
    expect(vi.mocked(TouchInputField).mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        value: '1.',
        error: 'Enter a valid number',
      })
    )
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
    const nextCall = vi.mocked(TouchInputField).mock.calls.at(-1)
    act(() => {
      nextCall?.[0].onChange?.({
        target: { value: '1.5' },
      } as ChangeEvent<HTMLInputElement>)
    })
    expect(vi.mocked(TouchInputField).mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        value: '1.5',
        error: 'Value must be between 5 to 50',
      })
    )
  })
})
