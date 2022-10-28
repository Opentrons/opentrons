import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { InProgressModal } from '../InProgressModal'

const render = (props: React.ComponentProps<typeof InProgressModal>) => {
  return renderWithProviders(<InProgressModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}
describe('InProgressModal', () => {
  let props: React.ComponentProps<typeof InProgressModal>

  it('renders the correct text with no child', () => {
    const { getByLabelText } = render(props)
    getByLabelText('spinner')
  })

  it('renders the correct text with child', () => {
    props = {
      children: <div>Moving gantry...</div>,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('Moving gantry...')
    getByLabelText('spinner')
  })
  it('renders the correct info when spinner is overriden', () => {
    props = {
      alternativeSpinner: <div>alternative spinner</div>,
    }
    const { getByText } = render(props)
    getByText('alternative spinner')
  })
})
