/* eslint-disable testing-library/no-node-access */
import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../../../__testing-utils__'
import { i18n } from '../../../../../i18n'
import { getRobotUpdateDisplayInfo } from '../../../../../redux/robot-update'

import { UpdateRobotSoftware } from '../UpdateRobotSoftware'

vi.mock('../../../../../redux/robot-settings/selectors')
vi.mock('../../../../../redux/discovery')
vi.mock('../../../../../redux/robot-update/selectors')
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
})
