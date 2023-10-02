import * as React from 'react'

import { i18n } from '../../../i18n'

import { renderWithProviders } from '@opentrons/components'

import { AddDeckConfigurationModal } from '../AddDeckConfigurationModal'

const render = (
  props: React.ComponentProps<typeof AddDeckConfigurationModal>
) => {
  return renderWithProviders(<AddDeckConfigurationModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('AddDeckConfigurationModal', () => {
  let props: React.ComponentProps<typeof AddDeckConfigurationModal>

  beforeEach(() => {
    props = {
      slotName: 'D3',
    }
  })
  it('should render text and buttons', () => {
    const [{ getByText, getAllByText }] = render(props)
    getByText('Add to slot D3')
    getByText(
      'Add this fixture to your deck configuration. It will be referenced during protocol analysis.'
    )
    getByText('Staging area slot')
    getByText('Trash')
    getByText('Waste chute')
    expect(getAllByText('Add').length).toBe(3)
  })

  it.todo('should a mock function when tapping a button')
})
