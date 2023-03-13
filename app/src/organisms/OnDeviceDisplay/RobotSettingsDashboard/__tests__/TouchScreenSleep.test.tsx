import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { TouchScreenSleep } from '../TouchScreenSleep'

const render = (props: React.ComponentProps<typeof TouchScreenSleep>) => {
  return renderWithProviders(<TouchScreenSleep {...props} />, {
    i18nInstance: i18n,
  })
}

describe('TouchScreenSleep', () => {
  let props: React.ComponentProps<typeof TouchScreenSleep>

  beforeEach(() => {
    props = {
      setCurrentOption: jest.fn(),
    }
  })

  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Touchscreen Sleep')
    getByText('Never')
    getByText('3 minutes')
    getByText('15 minutes')
    getByText('30 minutes')
    getByText('1 hour')
  })

  // ToDo (kj:02/06/2023) Additional tests will be added when we implement the update functionality
})
