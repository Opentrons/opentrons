import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { DisplaySleepSettings } from '../DisplaySleepSettings'

const render = (props: React.ComponentProps<typeof DisplaySleepSettings>) => {
  return renderWithProviders(<DisplaySleepSettings {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DisplaySleepSettings', () => {
  let props: React.ComponentProps<typeof DisplaySleepSettings>

  beforeEach(() => {
    props = {
      setCurrentOption: jest.fn(),
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Never')
    getByText('3 minutes')
    getByText('15 minutes')
    getByText('30 minutes')
    getByText('1 hour')
  })

  // ToDo (kj:02/06/2023) Additional tests will be added when we implement the update functionality
})
