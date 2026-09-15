import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { getRobotUpdateDisplayInfo } from '/app/redux/robot-update'
import { remote } from '/app/redux/shell/remote'

import { UpdateRobotSoftware } from '../UpdateRobotSoftware'

import type { ComponentProps } from 'react'

const mockStartUpdate = vi.hoisted(() => vi.fn(() => true))
const mockGatedStart = vi.hoisted(() => ({
  startUpdate: mockStartUpdate,
  isLoading: false,
}))

vi.mock('/app/redux/discovery')
vi.mock('/app/redux/robot-update/selectors')
vi.mock('/app/local-resources/access-control/useGatedStartRobotUpdate', () => ({
  useGatedStartRobotUpdate: () => mockGatedStart,
}))
vi.mock('/app/redux/shell/remote', () => ({
  remote: {
    getFilePathFrom: vi.fn(),
  },
}))
vi.mock('../../../hooks')

const mockOnUpdateStart = vi.fn()
const SYSTEM_FILE = new File(['zip-bytes'], 'system.zip', {
  type: 'application/zip',
})

const render = (
  props?: Partial<ComponentProps<typeof UpdateRobotSoftware>>
) => {
  return renderWithProviders(
    <UpdateRobotSoftware
      robotName="otie"
      onUpdateStart={mockOnUpdateStart}
      currentRun={props?.currentRun ?? null}
    />,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UpdateRobotSoftware', () => {
  beforeEach(() => {
    mockStartUpdate.mockClear()
    mockStartUpdate.mockReturnValue(true)
    mockGatedStart.isLoading = false
    mockOnUpdateStart.mockClear()
    vi.mocked(remote.getFilePathFrom).mockResolvedValue('/path/to/system.zip')
    vi.mocked(getRobotUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'update',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
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
    const link = screen.getByRole('link', {
      name: /Launch Opentrons software update page/,
    })
    expect(link).toHaveAttribute('href', 'https://opentrons.com/app')
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

  it('should be disabled if a run is running', () => {
    render({ currentRun: { data: { status: RUN_STATUS_RUNNING } } } as any)
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

  it('starts the update after selecting a zip file', async () => {
    render()
    fireEvent.change(screen.getByTestId('UpdateRobotSoftware_fileInput'), {
      target: { files: [SYSTEM_FILE] },
    })

    await waitFor(() => {
      expect(mockStartUpdate).toHaveBeenCalledWith('/path/to/system.zip')
    })
    expect(mockOnUpdateStart).toHaveBeenCalledTimes(1)
  })

  it('still starts the update if the live FileList is emptied before the path resolves', async () => {
    let resolvePath: (path: string) => void = () => {}
    vi.mocked(remote.getFilePathFrom).mockImplementation(
      () =>
        new Promise(resolve => {
          resolvePath = resolve
        })
    )

    render()
    const files = [SYSTEM_FILE]
    fireEvent.change(screen.getByTestId('UpdateRobotSoftware_fileInput'), {
      target: { files },
    })
    files.pop()
    resolvePath('/path/to/system.zip')

    await waitFor(() => {
      expect(mockStartUpdate).toHaveBeenCalledWith('/path/to/system.zip')
    })
    expect(mockOnUpdateStart).toHaveBeenCalledTimes(1)
  })

  it('does not start the update when the file picker is cancelled', () => {
    render()
    fireEvent.change(screen.getByTestId('UpdateRobotSoftware_fileInput'), {
      target: { files: [] },
    })

    expect(remote.getFilePathFrom).not.toHaveBeenCalled()
    expect(mockStartUpdate).not.toHaveBeenCalled()
    expect(mockOnUpdateStart).not.toHaveBeenCalled()
  })

  it('waits for admin queries to settle before starting the update', async () => {
    mockGatedStart.isLoading = true
    const [{ rerender }] = render()

    fireEvent.change(screen.getByTestId('UpdateRobotSoftware_fileInput'), {
      target: { files: [SYSTEM_FILE] },
    })

    await waitFor(() => {
      expect(remote.getFilePathFrom).toHaveBeenCalled()
    })
    expect(mockStartUpdate).not.toHaveBeenCalled()

    mockGatedStart.isLoading = false
    rerender(
      <UpdateRobotSoftware
        robotName="otie"
        onUpdateStart={mockOnUpdateStart}
        currentRun={null}
      />
    )

    await waitFor(() => {
      expect(mockStartUpdate).toHaveBeenCalledWith('/path/to/system.zip')
    })
    expect(mockOnUpdateStart).toHaveBeenCalledTimes(1)
  })

  it('does not open the updating modal when starting the update is blocked', async () => {
    mockStartUpdate.mockReturnValue(false)
    render()
    fireEvent.change(screen.getByTestId('UpdateRobotSoftware_fileInput'), {
      target: { files: [SYSTEM_FILE] },
    })

    await waitFor(() => {
      expect(mockStartUpdate).toHaveBeenCalledWith('/path/to/system.zip')
    })
    expect(mockOnUpdateStart).not.toHaveBeenCalled()
  })
})
