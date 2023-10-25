import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { DeckConfigurationDiscardChangesModal } from '../DeckConfigurationDiscardChangesModal'

const mockFunc = jest.fn()

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
    // ToDo (kk:09/29/2023) need to update this test case later
    expect(mockFunc).toHaveBeenCalled()
  })

  it('should call a mock function when tapping continue editing button', () => {
    const [{ getByText }] = render(props)
    getByText('Continue editing').click()
    expect(mockFunc).toHaveBeenCalled()
  })
})
