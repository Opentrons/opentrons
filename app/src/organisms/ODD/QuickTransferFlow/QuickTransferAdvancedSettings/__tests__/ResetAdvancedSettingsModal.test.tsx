import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ResetAdvancedSettingsModal } from '../ResetAdvancedSettingsModal'

import type { ComponentProps } from 'react'
import type { LiquidClass } from '@opentrons/shared-data'

const render = (props: ComponentProps<typeof ResetAdvancedSettingsModal>) => {
  return renderWithProviders(<ResetAdvancedSettingsModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ResetAdvancedSettingsModal', () => {
  let props: ComponentProps<typeof ResetAdvancedSettingsModal>

  beforeEach(() => {
    props = {
      kind: 'aspirate',
      liquidClass: {
        displayName: 'Water',
        liquidClassName: 'water',
      } as LiquidClass,
      onClose: vi.fn(),
    }
  })

  it('renders the modal with correct title and description with liquid class - aspirate', () => {
    render(props)
    screen.getByText('Reset aspirate settings?')
    screen.getByText(
      'Continuing will undo any changes and restore the aspirate settings to the values associated with the Water liquid class.'
    )
    screen.getByText('Cancel')
    screen.getByText('Continue')
  })

  it('renders the modal with correct title and description - aspirate', () => {
    props.liquidClass = {
      displayName: '',
      liquidClassName: 'none',
    } as LiquidClass
    render(props)
    screen.getByText('Reset aspirate settings?')
    screen.getByText(
      'Continuing will undo any changes and restore the aspirate settings back to the default values.'
    )
    screen.getByText('Cancel')
    screen.getByText('Continue')
  })

  it('renders the modal with correct title and description with liquid class - dispense', () => {
    props.kind = 'dispense'
    render(props)
    screen.getByText('Reset dispense settings?')
    screen.getByText(
      'Continuing will undo any changes and restore the dispense settings to the values associated with the Water liquid class.'
    )
    screen.getByText('Cancel')
    screen.getByText('Continue')
  })

  it('renders the modal with correct title and description - dispense', () => {
    props.kind = 'dispense'
    props.liquidClass = {
      displayName: '',
      liquidClassName: 'none',
    } as LiquidClass
    render(props)
    screen.getByText('Reset dispense settings?')
    screen.getByText(
      'Continuing will undo any changes and restore the dispense settings back to the default values.'
    )
    screen.getByText('Cancel')
    screen.getByText('Continue')
  })

  it('calls onClose when the close button is clicked', () => {
    render(props)

    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()
  })
  // Todo add continue button test
})
