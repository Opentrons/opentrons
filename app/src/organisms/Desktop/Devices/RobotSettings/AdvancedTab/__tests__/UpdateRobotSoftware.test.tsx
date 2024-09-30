/* eslint-disable testing-library/no-node-access */
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'

import { UpdateRobotSoftware } from '../UpdateRobotSoftware'

vi.mock('/app/redux/robot-settings/selectors')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update/selectors')
vi.mock('../../../hooks')

const mockOnUpdateStart = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UpdateRobotSoftware
        robotName="otie"
        isRobotBusy={false}
        onUpdateStart={mockOnUpdateStart}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UpdateRobotSoftware', () => {
  beforeEach(() => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'update',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
  })

  it('should render title, description and toggle button', () => {
    render()
    screen.getByText('Update robot software manually with a local file (.zip)')
    screen.getByText(
      'Bypass the Opentrons App auto-update process and update the robot software manually.'
    )
    screen.getByText('Browse file system')
    screen.getByText('Launch Opentrons software update page')
  })

  it('should the link has the correct attribute', () => {
    render()
    const targetLink = 'https://opentrons.com/ot-app/'
    const link = screen.getByText('Launch Opentrons software update page')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('should be disabled if updateFromFileDisabledReason is not null', () => {
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'update',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: 'mock reason',
    })
    render()
    const button = screen.getByText('Browse file system')
    expect(button).toBeDisabled()
  })

  it('should render a banner warning users about downgrading their robot', () => {
    render()
    screen.getByTestId('Banner_warning')
    screen.getByLabelText('icon_warning')
    screen.getByText(
      'You should not downgrade to a software version released before the manufacture date of your robot or any attached hardware.'
    )
  })
})
