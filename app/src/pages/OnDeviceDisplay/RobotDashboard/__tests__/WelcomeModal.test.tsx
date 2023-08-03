import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { updateConfigValue } from '../../../../redux/config'
import { WelcomedModal } from '../WelcomeModal'

jest.mock('../../../../redux/config')

const mockFunc = jest.fn()
const WELCOME_MODAL_IMAGE_NAME = 'welcome_dashboard_modal.png'

const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

const render = (props: React.ComponentProps<typeof WelcomedModal>) => {
  return renderWithProviders(<WelcomedModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WelcomeModal', () => {
  let props: React.ComponentProps<typeof WelcomedModal>

  beforeEach(() => {
    props = {
      setShowWelcomeModal: mockFunc,
    }
  })

  it('should render text and button', () => {
    const [{ getByText, getByRole }] = render(props)
    const image = getByRole('img')

    expect(image.getAttribute('src')).toEqual(WELCOME_MODAL_IMAGE_NAME)
    getByText('Welcome to your dashboard!')
    getByText(
      'A place to run protocols, manage your instruments, and view robot status.'
    )
    getByText('Got it')
  })

  it('should call a mock function when tapping got it button', () => {
    const [{ getByText }] = render(props)
    getByText('Got it').click()
    expect(mockUpdateConfigValue).toHaveBeenCalled()
    expect(props.setShowWelcomeModal).toHaveBeenCalled()
  })
})
