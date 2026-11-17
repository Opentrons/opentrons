import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { getVolumeRange } from '../utils'
import { VolumeEntry } from '../VolumeEntry'

import type { ComponentProps } from 'react'

vi.mock('../utils')

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
    expect(screen.getByLabelText('Volume per well (µL)')).toHaveValue('')
    screen.getByRole('button', { name: '1' })
    const continueBtn = screen.getByTestId('ChildNavigation_Primary_Button')
    expect(continueBtn).toBeDisabled()
  })

  it('renders transfer text if there are more destination wells than source wells', () => {
    render(props)
    screen.getByText('Set transfer volume')
    expect(screen.getByLabelText('Volume per well (µL)')).toHaveValue('')
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
    expect(screen.getByLabelText('Dispense volume per well (µL)')).toHaveValue(
      ''
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
    expect(screen.getByLabelText('Aspirate volume per well (µL)')).toHaveValue(
      ''
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
    expect(screen.getByLabelText('Aspirate volume per well (µL)')).toHaveValue(
      '90'
    )
    screen.getByText('Value must be between 5 to 50')
  })

  it('retains malformed input, shows an error, and disables continue', () => {
    render(props)
    const input = screen.getByLabelText('Volume per well (µL)')
    fireEvent.change(input, { target: { value: '1.' } })
    expect(input).toHaveValue('1.')
    screen.getByText('Enter a valid number')
    expect(screen.getByTestId('ChildNavigation_Primary_Button')).toBeDisabled()
    fireEvent.change(input, { target: { value: '1.5' } })
    expect(input).toHaveValue('1.5')
    screen.getByText('Value must be between 5 to 50')
  })
})
