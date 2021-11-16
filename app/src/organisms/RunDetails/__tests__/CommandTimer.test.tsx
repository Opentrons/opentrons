import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandTimer } from '../CommandTimer'
import { useFormatRunTimestamp, useTimeElapsedSincePause } from '../hooks'

jest.mock('../hooks')

const mockUseFormatRunTimestamp =  useFormatRunTimestamp as jest.MockedFunction<
  typeof useFormatRunTimestamp
>
const mockUseTimeElapsedSincePause =  useTimeElapsedSincePause as jest.MockedFunction<
  typeof useTimeElapsedSincePause
>

const render = (props: React.ComponentProps<typeof CommandTimer>) => {
  return renderWithProviders(<CommandTimer {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const MOCK_ELAPSED_TIME = '10 minutes'

describe('CommandTimer', () => {
  let props: React.ComponentProps<typeof CommandTimer>

  beforeEach(() => {
    mockUseFormatRunTimestamp.mockReturnValue((timestamp) => timestamp)
    mockUseTimeElapsedSincePause.mockReturnValue(MOCK_ELAPSED_TIME)
  })
  it('renders correct time when runStatus is paused', () => {
    props = {
      commandStartedAt: '0',
      commandCompletedAt: undefined,
    }
    const { getByText } = render(props)
    getByText('0')
    getByText('10 minutes')
    getByText('-- : -- : --')
  })
  it('renders correct time when runStatus is not paused', () => {
    props = {
      commandStartedAt: '5',
      commandCompletedAt: '10',
    }
    const { getByText } = render(props)
    getByText('5')
    getByText('10')
  })
})
