import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { InitialSplash } from '../InitialSplash'

const LOGO_PNG_FILE_NAME = 'opentrons_logo.png'
const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = () => {
  return renderWithProviders(<InitialSplash />)[0]
}
describe('InitialSplash', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render splash screen with an image', () => {
    const { getByRole } = render()
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(LOGO_PNG_FILE_NAME)
  })

  it('should move screen after 4 sec', async () => {
    const { getByRole } = render()
    getByRole('img')
    jest.advanceTimersByTime(100)
    expect(mockPush).not.toHaveBeenCalled()
    jest.advanceTimersByTime(5000)
    expect(mockPush).toHaveBeenCalledWith('/select-wifi-network')
  })
})
