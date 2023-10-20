import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DeckConfigurationDiscardChangesModal } from '../DeckConfigurationDiscardChangesModal'

const mockFunc = jest.fn()
const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ goBack: mockPush } as any),
  }
})

const render = (
  props: React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>
) => {
  return renderWithProviders(
    <DeckConfigurationDiscardChangesModal {...props} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeckConfigurationDiscardChangesModal', () => {
  let props: React.ComponentProps<typeof DeckConfigurationDiscardChangesModal>

  beforeEach(() => {
    props = {
      setShowConfirmationModal: mockFunc,
    }
  })
  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Changes will be lost')
    getByText(
      'Are you sure you want to exit without saving your deck configuration?'
    )
    getByText('Discard changes')
    getByText('Continue editing')
  })

  it('should call a mock function when tapping discard changes button', () => {
    const [{ getByText }] = render(props)
    getByText('Discard changes').click()
    expect(mockFunc).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalled()
  })

  it('should call a mock function when tapping continue editing button', () => {
    const [{ getByText }] = render(props)
    getByText('Continue editing').click()
    expect(mockFunc).toHaveBeenCalledWith(false)
  })
})
