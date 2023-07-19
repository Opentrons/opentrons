import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { EmptySection } from '../EmptySection'

const render = (props: React.ComponentProps<typeof EmptySection>) => {
  return renderWithProviders(<EmptySection {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EmptySection', () => {
  let props: React.ComponentProps<typeof EmptySection>

  it('should render text for labware', () => {
    props = {
      section: 'labware',
    }
    const { getByText, getByLabelText } = render(props)
    getByLabelText('EmptySection_ot-alert')
    getByText('No labware is specified for this protocol')
  })
  it('should render text for liquid', () => {
    props = {
      section: 'liquids',
    }
    const { getByText } = render(props)
    getByText('No liquids are specified for this protocol')
  })
  it('should render text for hardware', () => {
    props = {
      section: 'hardware',
    }
    const { getByText } = render(props)
    getByText('No hardware is specified for this protocol')
  })
})
