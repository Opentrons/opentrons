import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useResetConfigOptionsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsFlex } from '/app/redux-resources/robots'
import { useDownloadCalibrationData } from '/app/resources/devices/hooks'

import { DeviceResetSlideout } from '../DeviceResetSlideout'

import type * as ReactApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ReactApiClient>()
  return {
    ...actual,
    useResetConfigOptionsQuery: vi.fn(),
  }
})
vi.mock('/app/redux/config')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/devices/hooks')

const mockOnCloseClick = vi.fn()
const ROBOT_NAME = 'otie'
const mockUpdateResetStatus = vi.fn()
const downloadCalibration =
  vi.fn<ReturnType<typeof useDownloadCalibrationData>['downloadCalibration']>()

const mockResetConfigOptions = [
  {
    id: 'bootScripts',
    name: 'BootScript Foo',
    description: 'BootScript foo description',
  },
  {
    id: 'deckCalibration',
    name: 'deck Calibration Bar',
    description: 'deck Calibration bar description',
  },
  {
    id: 'pipetteOffsetCalibrations',
    name: 'pipette calibration FooBar',
    description: 'pipette calibration fooBar description',
  },
  {
    id: 'gripperOffsetCalibrations',
    name: 'gripper calibration FooBar',
    description: 'gripper calibration fooBar description',
  },
  {
    id: 'runsHistory',
    name: 'RunsHistory FooBar',
    description: 'runsHistory fooBar description',
  },
  {
    id: 'tipLengthCalibrations',
    name: 'tip length FooBar',
    description: 'tip length fooBar description',
  },
  {
    id: 'moduleCalibration',
    name: 'module calibration FooBar',
    description: 'moduleCalibration fooBar description',
  },
  {
    id: 'authorizedKeys',
    name: 'SSH Keys Foo',
    description: 'SSH Keys foo description',
  },
]

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceResetSlideout
        isExpanded={true}
        onCloseClick={mockOnCloseClick}
        robotName={ROBOT_NAME}
        updateResetStatus={mockUpdateResetStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceResetSlideout', () => {
  beforeEach(() => {
    vi.mocked(useResetConfigOptionsQuery).mockReturnValue({
      data: { options: mockResetConfigOptions },
    } as any)
    vi.mocked(useIsFlex).mockReturnValue(false)
    vi.mocked(useDownloadCalibrationData).mockReturnValue({
      downloadCalibration,
    } as any)
  })

  it('should change some options and text for Flex', () => {
    vi.mocked(useIsFlex).mockReturnValue(true)
    render()
    screen.getByText('Clear all data')
    screen.getByText(
      'Clears calibrations, protocols, and all settings. You’ll have to redo initial setup before using the robot again.'
    )
    screen.getByText('Clear pipette calibration')
    screen.getByText('Clear gripper calibration')
    screen.getByRole('checkbox', { name: 'Clear pipette calibration' })
    screen.getByRole('checkbox', { name: 'Clear gripper calibration' })
    screen.getByRole('checkbox', { name: 'Clear module calibration' })
    screen.getByRole('checkbox', { name: 'Clear labware offset data' })
  })

  it('should enable Clear data and restart robot button when checked one checkbox', () => {
    render()
    const checkbox = screen.getByRole('checkbox', {
      name: 'Clear gripper calibration',
    })
    fireEvent.click(checkbox)
    const clearButton = screen.getByRole('button', {
      name: 'Clear data and restart robot',
    })
    expect(clearButton).toBeEnabled()
  })

  it('should close the slideout when clicking close icon button', () => {
    render()
    const closeButton = screen.getByRole('button', { name: 'exit' })
    fireEvent.click(closeButton)
    expect(mockOnCloseClick).toHaveBeenCalled()
  })
})
