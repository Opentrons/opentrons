import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { AlternativeSecurityTypeModal } from '../AlternativeSecurityTypeModal'

import type { useHistory } from 'react-router-dom'

const mockFunc = vi.fn()
const mockPush = vi.fn()
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (
  props: React.ComponentProps<typeof AlternativeSecurityTypeModal>
) => {
  return renderWithProviders(<AlternativeSecurityTypeModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AlternativeSecurityTypeModal', () => {
  let props: React.ComponentProps<typeof AlternativeSecurityTypeModal>

  beforeEach(() => {
    props = {
      setShowAlternativeSecurityTypeModal: mockFunc,
    }
  })

  it('should render text and button', () => {
    render(props)
    screen.getByText('Alternative security types')
    screen.getByText(
      'The Opentrons App supports connecting Flex to various enterprise access points. Connect via USB and finish setup in the app.'
    )
    screen.getByText('Connect via USB')
  })

  it('should call mock function when tapping close button', () => {
    render(props)
    const button = screen.getByLabelText('closeIcon')
    fireEvent.click(button)
    expect(mockFunc).toHaveBeenCalled()
  })
  it('should call mock function when tapping connect via usb button', () => {
    render(props)
    const button = screen.getByText('Connect via USB')
    fireEvent.click(button)
    expect(mockFunc).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
