import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { RobotSystemVersionModal } from '../RobotSystemVersionModal'

const mockFn = jest.fn()
const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (
  props: React.ComponentProps<typeof RobotSystemVersionModal>
) => {
  return renderWithProviders(<RobotSystemVersionModal {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotSystemVersionModal', () => {
  let props: React.ComponentProps<typeof RobotSystemVersionModal>

  beforeEach(() => {
    props = {
      version: 'mockVersion',
      releaseNotes: 'mockReleaseNote',
      setShowModal: mockFn,
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
  it('should render text and buttons', () => {
    const [{ getByText }] = render(props)
    getByText('Robot System Version mockVersion available')
    getByText('Updating the robot system requires a restart')
    getByText('mockReleaseNote')
    getByText('Not now')
    getByText('Update')
  })

  it('should close the modal when tapping remind me later', () => {
    const [{ getByText }] = render(props)
    getByText('Update').click()
    expect(mockPush).toHaveBeenCalledWith('/robot-settings/update-robot')
  })

  it('should call the mock function when tapping update', () => {
    const [{ getByText }] = render(props)
    getByText('Not now').click()
    expect(mockFn).toHaveBeenCalled()
  })
})
