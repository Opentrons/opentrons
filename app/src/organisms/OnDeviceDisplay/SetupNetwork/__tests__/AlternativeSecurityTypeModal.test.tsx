import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { AlternativeSecurityTypeModal } from '../AlternativeSecurityTypeModal'

const mockFunc = jest.fn()
const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
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
    const [{ getByText }] = render(props)
    getByText('Alternative security types')
    getByText(
      'The Opentrons App supports connecting Flex to various enterprise access points. Connect via USB and finish setup in the app.'
    )
    getByText('Connect via USB')
  })

  it('should call mock function when tapping close button', () => {
    const [{ getByLabelText }] = render(props)
    const button = getByLabelText('closeIcon')
    button.click()
    expect(mockFunc).toHaveBeenCalled()
  })
  it('should call mock function when tapping connect via usb button', () => {
    const [{ getByText }] = render(props)
    const button = getByText('Connect via USB')
    button.click()
    expect(mockFunc).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/network-setup/usb')
  })
})
