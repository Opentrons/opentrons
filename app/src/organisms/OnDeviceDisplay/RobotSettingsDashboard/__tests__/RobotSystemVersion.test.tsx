import * as React from 'react'
import { fireEvent } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { RobotSystemVersion } from '../RobotSystemVersion'

jest.mock('../../../../redux/shell')

const mockBack = jest.fn()

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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render text when there is no available update', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Robot System Version')
    getByRole('button')
    getByText(
      'View latest release notes on https://github.com/Opentrons/opentrons'
    )
    getByText('Current Version:')
    getByText('mock7.0.0')
  })

  it('should render text when there is available update', () => {
    props = {
      ...props,
      isUpdateAvailable: true,
    }
    const [{ getByText, getByRole }] = render(props)
    getByText('Update available')
    getByRole('button', { name: 'View software update' })
  })

  it('should call a mock function when tapping Back button', () => {
    const [{ getByRole }] = render(props)
    const button = getByRole('button')
    fireEvent.click(button)
    expect(mockBack).toHaveBeenCalled()
  })
})
