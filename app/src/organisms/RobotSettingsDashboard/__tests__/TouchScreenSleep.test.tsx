import * as React from 'react'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { updateConfigValue } from '../../../redux/config'
import { TouchScreenSleep } from '../TouchScreenSleep'

jest.mock('../../../redux/config')

// Note (kj:06/28/2023) this line is to avoid causing errors for scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()
const mockUpdateConfigValue = updateConfigValue as jest.MockedFunction<
  typeof updateConfigValue
>

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
    getByText('5 minutes')
    getByText('10 minutes')
    getByText('15 minutes')
    getByText('30 minutes')
    getByText('1 hour')
  })

  it('should call a mock function when changing the sleep option', () => {
    const [{ getByText }] = render(props)
    const button = getByText('10 minutes')
    fireEvent.click(button)
    expect(mockUpdateConfigValue).toHaveBeenCalled()
  })
})
