import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UnskippableModal } from '../UnskippableModal'

const render = (props: React.ComponentProps<typeof UnskippableModal>) => {
  return renderWithProviders(<UnskippableModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UnskippableModal', () => {
  let props: React.ComponentProps<typeof UnskippableModal>
  it('returns the correct information for unskippable modal, pressing return button calls goBack prop', () => {
    props = {
      goBack: jest.fn(),
    }
    const { getByText, getByRole } = render(props)
    getByText('This is a critical step that cannot be skipped')
    getByText('You must detach the mounting plate before using other pipettes.')
    getByRole('button', { name: 'return' }).click()
    expect(props.goBack).toHaveBeenCalled()
  })
})
