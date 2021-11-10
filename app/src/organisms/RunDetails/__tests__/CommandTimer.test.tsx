import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandTimer } from '../CommandTimer'

const render = (props: React.ComponentProps<typeof CommandTimer>) => {
  return renderWithProviders(<CommandTimer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('CommandTimer', () => {
  let props: React.ComponentProps<typeof CommandTimer>

  beforeEach(() => {
    props = {
      start: '0',
      timer: '30',
      end: '1',
      runStatus: 'paused',
    }
  })
  it('renders correct time when runStatus is paused', () => {
    const { getByText } = render(props)
    getByText('0')
    getByText('30')
    getByText('1')
  })
  it('renders correct time when runStatus is not paused', () => {
    props = {
      start: '5',
      end: '10',
    }
    const { getByText } = render(props)
    getByText('5')
    getByText('10')
  })
})
