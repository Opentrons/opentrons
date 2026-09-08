import { MemoryRouter } from 'react-router-dom'
import { act, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useToaster } from '/app/organisms/ToasterOven'
import { useRobot } from '/app/redux-resources/robots'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'

import { Troubleshooting } from '../Troubleshooting'

import type { ComponentProps } from 'react'
import type { HostConfig } from '@opentrons/api-client'
import type { ToasterContextType } from '/app/organisms/ToasterOven/ToasterContext'

const mockJSZip = vi.hoisted(() => ({
  file: vi.fn(),
  generateAsync: vi.fn(),
}))

const mockSaveFileWithPicker = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined)
)
const MockJSZip = vi.hoisted(
  () =>
    function MockJSZip(): typeof mockJSZip {
      return mockJSZip
    }
)

vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/local-resources/files/saveFileWithPicker', () => ({
  saveFileWithPicker: mockSaveFileWithPicker,
  isFileSaveCanceledError: vi.fn(),
}))
vi.mock('jszip', () => {
  return {
    default: MockJSZip,
  }
})

const ROBOT_NAME = 'otie'
const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MOCK_MAKE_TOAST = vi.fn()
const MOCK_EAT_TOAST = vi.fn()

const render = (props: ComponentProps<typeof Troubleshooting>) => {
  return renderWithProviders(
    <MemoryRouter>
      <Troubleshooting {...props} />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings Troubleshooting', () => {
  let props: ComponentProps<typeof Troubleshooting>
  beforeEach(() => {
    mockJSZip.file.mockClear()
    mockJSZip.generateAsync.mockClear()
    mockJSZip.generateAsync.mockResolvedValue(new ArrayBuffer(8))
    mockSaveFileWithPicker.mockClear()
    MOCK_MAKE_TOAST.mockClear()
    MOCK_MAKE_TOAST.mockReturnValue('mock-toast-id')
    MOCK_EAT_TOAST.mockClear()

    props = {
      robotName: ROBOT_NAME,
    }
    when(useRobot).calledWith(ROBOT_NAME).thenReturn(mockConnectableRobot)
    when(useHost).calledWith().thenReturn(HOST_CONFIG)
    when(useToaster)
      .calledWith()
      .thenReturn({
        makeToast: MOCK_MAKE_TOAST,
        eatToast: MOCK_EAT_TOAST,
      } as unknown as ToasterContextType)
  })
  it('should render title, description, and button', () => {
    render(props)
    screen.getByText('Troubleshooting')
    screen.getByTestId('RobotSettings_Troubleshooting')
    screen.getByRole('button', { name: 'Download logs' })
  })

  it('should be disabled when logs are not available', () => {
    when(useRobot).calledWith('otie').thenReturn(mockUnreachableRobot)
    render(props)
    const downloadLogsButton = screen.getByRole('button', {
      name: 'Download logs',
    })
    expect(downloadLogsButton).toBeDisabled()
  })

  it('should initiate log download when clicking Download logs button', async () => {
    render(props)
    const downloadLogsButton = screen.getByRole('button', {
      name: 'Download logs',
    })

    act(() => {
      downloadLogsButton.click()
    })

    expect(MOCK_MAKE_TOAST).toBeCalledWith('Downloading logs...', 'info', {
      disableTimeout: true,
      icon: { name: 'ot-spinner', spin: true },
    })

    await waitFor(() => {
      expect(downloadLogsButton).toBeDisabled()
    })

    await waitFor(
      () => {
        expect(MOCK_EAT_TOAST).toHaveBeenCalledWith('mock-toast-id')
      },
      { timeout: 3000 }
    )

    await waitFor(
      () => {
        expect(mockSaveFileWithPicker).toHaveBeenCalledWith(
          'otie_logs.zip',
          expect.any(ArrayBuffer)
        )
      },
      { timeout: 3000 }
    )
  })
})
