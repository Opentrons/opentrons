import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { RobotSystemVersion } from '../RobotSystemVersion'
import { RobotSystemVersionModal } from '../RobotSystemVersionModal'

jest.mock('../../../redux/shell')
jest.mock('../RobotSystemVersionModal')

const mockBack = jest.fn()

const mockRobotSystemVersionModal = RobotSystemVersionModal as jest.MockedFunction<
  typeof RobotSystemVersionModal
>

const render = (props: React.ComponentProps<typeof RobotSystemVersion>) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotSystemVersion {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotSystemVersion', () => {
  let props: React.ComponentProps<typeof RobotSystemVersion>

  beforeEach(() => {
    props = {
      currentVersion: 'mock7.0.0',
      isUpdateAvailable: false,
      setCurrentOption: mockBack,
    }
    mockRobotSystemVersionModal.mockReturnValue(
      <div>mock RobotSystemVersionModal</div>
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text when there is no available update', () => {
    const [{ getByText }] = render(props)
    getByText('Robot System Version')
    getByText(
      'View latest release notes at https://github.com/Opentrons/opentrons'
    )
    getByText('Current Version:')
    getByText('mock7.0.0')
  })

  it('should render text when there is available update', () => {
    props = {
      ...props,
      isUpdateAvailable: true,
    }
    const [{ getByText }] = render(props)
    getByText('Update available')
    getByText('View update')
  })

  it('should render mock robot system version modal when tapping view update', () => {
    props = {
      ...props,
      isUpdateAvailable: true,
    }
    const [{ getByText }] = render(props)
    getByText('View update').click()
    getByText('mock RobotSystemVersionModal')
  })

  it('should call a mock function when tapping Back button', () => {
    const [{ getByRole }] = render(props)
    getByRole('button').click()
    expect(mockBack).toHaveBeenCalled()
  })
})
