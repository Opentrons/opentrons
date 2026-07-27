import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RobotOutOfStorageBanner } from '..'

vi.mock('/app/resources/devices')
vi.mock('react-router-dom')

const ROBOT_NAME = 'otie'

const navigate = vi.fn()

const render = () => {
  return renderWithProviders(
    <RobotOutOfStorageBanner robotName={ROBOT_NAME} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('RobotOutOfStorageBanner', () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(navigate)
  })
  it('renders body text', () => {
    render()
    screen.getByText('Robot storage is almost full')
    screen.getByText(
      'Download and delete old protocol run records and associated files to free up space before starting a run.'
    )
  })

  it('navigates to robot file manager', () => {
    render()
    const manageFilesLink = screen.getByText('Manage files')
    fireEvent.click(manageFilesLink)
    expect(navigate).toHaveBeenCalledWith(
      '/devices/otie/robot-settings/file-manager'
    )
  })
})
