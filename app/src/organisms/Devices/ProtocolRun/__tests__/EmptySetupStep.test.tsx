import React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { EmptySetupStep } from '../EmptySetupStep'

const render = (props: React.ComponentProps<typeof EmptySetupStep>) => {
  return renderWithProviders(<EmptySetupStep {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EmptySetupStep', () => {
  let props: React.ComponentProps<typeof EmptySetupStep>
  beforeEach(() => {
    props = {
      title: 'mockTitle',
      description: 'mockDescription',
      label: 'mockLabel',
    }
  })

  it('should render the title, description, and label', () => {
    const { getByText } = render(props)
    getByText('mockTitle')
    getByText('mockDescription')
    getByText('mockLabel')
  })
})
