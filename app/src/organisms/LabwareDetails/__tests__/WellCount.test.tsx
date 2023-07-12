import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { WellCount } from '../WellCount'

const render = (props: React.ComponentProps<typeof WellCount>) => {
  return renderWithProviders(<WellCount {...props} />, {
    i18nInstance: i18n,
  })
}

describe('WellCount', () => {
  let props: React.ComponentProps<typeof WellCount>
  beforeEach(() => {
    props = {
      count: 1,
      wellLabel: 'mockLabel',
    }
  })

  it('renders correct label and count', () => {
    const [{ getByText }] = render(props)

    getByText('mockLabel Count')
    getByText('1')
  })
})
