import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useCameraSettingsValues } from '/app/local-resources/images/hooks/useCameraSettingsValues'

import { CameraControls } from '..'
import { CameraControlsHome } from '../CameraControlsHome'
import { CameraTileSetting } from '../CameraTileSetting'
import { ZoomSettingsView } from '../ZoomSettingsView'

import type { CameraControlsProps } from '..'

vi.mock('/app/local-resources/images/hooks/useCameraSettingsValues')
vi.mock('../CameraControlsHome')
vi.mock('../CameraTileSetting')
vi.mock('../ZoomSettingsView')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = (props: CameraControlsProps) => {
  return renderWithProviders(<CameraControls {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraControls', () => {
  let mockProps: CameraControlsProps

  beforeEach(() => {
    mockProps = {
      toggleShowControls: vi.fn(),
      runId: 'run-id',
    }
    vi.mocked(useCameraSettingsValues).mockReturnValue({
      zoom: 1,
      brightness: 50,
      contrast: 50,
      saturation: 50,
      adjustZoom: vi.fn(),
      adjustBrightness: vi.fn(),
      adjustContrast: vi.fn(),
      adjustSaturation: vi.fn(),
      restoreToDefault: vi.fn(),
    })
    vi.mocked(CameraControlsHome).mockImplementation(({ setActiveSubView }) => (
      <div>
        <div>MOCK_CAMERA_CONTROLS_HOME</div>
        <button onClick={() => setActiveSubView('zoom')}>Zoom</button>
        <button onClick={() => setActiveSubView('brightness')}>
          Brightness
        </button>
        <button onClick={() => setActiveSubView('contrast')}>Contrast</button>
        <button onClick={() => setActiveSubView('saturation')}>
          Saturation
        </button>
      </div>
    ))
    vi.mocked(ZoomSettingsView).mockReturnValue(
      <div>MOCK_ZOOM_SETTINGS_VIEW</div>
    )
    vi.mocked(CameraTileSetting).mockReturnValue(
      <div>MOCK_CAMERA_TILE_SETTING</div>
    )
  })

  it('renders CameraControlsHome by default', () => {
    render(mockProps)

    screen.getByText('MOCK_CAMERA_CONTROLS_HOME')
  })

  it('renders ZoomSettingsView when zoom setting is clicked', () => {
    render(mockProps)

    const zoomButton = screen.getByText('Zoom')
    fireEvent.click(zoomButton)

    screen.getByText('MOCK_ZOOM_SETTINGS_VIEW')
    expect(vi.mocked(ZoomSettingsView)).toHaveBeenCalledWith(
      expect.objectContaining({
        zoomValue: 1,
        adjustZoom: expect.any(Function),
        returnToHomeView: expect.any(Function),
      }),
      {}
    )
  })

  it('renders CameraTileSetting when brightness setting is clicked', () => {
    render(mockProps)

    const brightnessButton = screen.getByText('Brightness')
    fireEvent.click(brightnessButton)

    screen.getByText('MOCK_CAMERA_TILE_SETTING')
    expect(vi.mocked(CameraTileSetting)).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 50,
        title: 'Brightness',
        subtext: 'Adjust the overall lightness or darkness.',
        adjustValue: expect.any(Function),
        returnToHomeView: expect.any(Function),
        isLoading: false,
      }),
      {}
    )
  })

  it('renders CameraTileSetting when contrast setting is clicked', () => {
    render(mockProps)

    const contrastButton = screen.getByText('Contrast')
    fireEvent.click(contrastButton)

    screen.getByText('MOCK_CAMERA_TILE_SETTING')
    expect(vi.mocked(CameraTileSetting)).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 50,
        title: 'Contrast',
        subtext:
          'Change the difference between light and dark areas to enhance clarity.',
        adjustValue: expect.any(Function),
        returnToHomeView: expect.any(Function),
      }),
      {}
    )
  })

  it('renders CameraTileSetting when saturation setting is clicked', () => {
    render(mockProps)

    const saturationButton = screen.getByText('Saturation')
    fireEvent.click(saturationButton)

    screen.getByText('MOCK_CAMERA_TILE_SETTING')
    expect(vi.mocked(CameraTileSetting)).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 50,
        title: 'Saturation',
        subtext: 'Make colors look more vivid or muted.',
        adjustValue: expect.any(Function),
        returnToHomeView: expect.any(Function),
      }),
      {}
    )
  })
})
