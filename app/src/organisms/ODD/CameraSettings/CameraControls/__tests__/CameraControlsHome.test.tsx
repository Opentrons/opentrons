import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import { useStubPreviewImage } from '/app/organisms/Desktop/Camera/CameraControls/PreviewSettings/hooks/useStubPreviewImage'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { CameraControlsHome } from '../CameraControlsHome'
import { ImagePreviewModal } from '../ImagePreviewModal'

// eslint-disable-next-line opentrons/no-imports-across-applications -- For active dev only
import type { UseStubCameraSettingsValuesResult } from '/app/organisms/Desktop/Camera/CameraControls/hooks/useStubCameraSettingsValues'
import type { CameraControlsHomeProps } from '../CameraControlsHome'

vi.mock(
  '/app/organisms/Desktop/Camera/CameraControls/PreviewSettings/hooks/useStubPreviewImage'
)
vi.mock('/app/organisms/ODD/ChildNavigation')
vi.mock('../ImagePreviewModal')

const render = (props: CameraControlsHomeProps) => {
  return renderWithProviders(<CameraControlsHome {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraControlsHome', () => {
  let mockProps: CameraControlsHomeProps
  let mockSettings: UseStubCameraSettingsValuesResult

  beforeEach(() => {
    mockSettings = {
      zoom: '1x',
      brightness: 50,
      contrast: 50,
      saturation: 50,
      adjustZoom: vi.fn(),
      adjustBrightness: vi.fn(),
      adjustContrast: vi.fn(),
      adjustSaturation: vi.fn(),
      restoreToDefault: vi.fn(),
    }
    mockProps = {
      setActiveSubView: vi.fn(),
      toggleShowControls: vi.fn(),
      settings: mockSettings,
    }
    vi.mocked(useStubPreviewImage).mockReturnValue({
      isLoading: false,
      imgPath: undefined,
      takePhoto: vi.fn(),
    })
    vi.mocked(ChildNavigation).mockReturnValue(<div>MOCK_CHILD_NAVIGATION</div>)
    vi.mocked(ImagePreviewModal).mockReturnValue(
      <div>MOCK_IMAGE_PREVIEW_MODAL</div>
    )
  })

  it('renders ChildNavigation with correct header', () => {
    render(mockProps)

    expect(vi.mocked(ChildNavigation)).toHaveBeenCalledWith(
      expect.objectContaining({
        header: 'Image and video settings',
        buttonText: 'Preview image',
      }),
      {}
    )
  })

  it('calls toggleShowControls when back button is clicked', () => {
    vi.mocked(ChildNavigation).mockImplementation(({ onClickBack }) => (
      <button onClick={onClickBack} data-testid="back-button">
        Back
      </button>
    ))

    render(mockProps)

    const backButton = screen.getByTestId('back-button')
    fireEvent.click(backButton)

    expect(mockProps.toggleShowControls).toHaveBeenCalledTimes(1)
  })

  it('renders zoom setting button with default zoom text', () => {
    render(mockProps)

    screen.getByText('Zoom')
    screen.getByText('1x (default zoom)')
  })

  it('renders zoom setting button with moderate zoom text', () => {
    const propsWithModerateZoom = {
      ...mockProps,
      settings: { ...mockSettings, zoom: '1.5x' as const },
    }
    render(propsWithModerateZoom)

    screen.getByText('1.5x (moderate zoom)')
  })

  it('renders zoom setting button with maximum zoom text', () => {
    const propsWithMaxZoom = {
      ...mockProps,
      settings: { ...mockSettings, zoom: '2x' as const },
    }
    render(propsWithMaxZoom)

    screen.getByText('2x (maximum zoom)')
  })

  it('renders brightness setting button', () => {
    render(mockProps)

    screen.getByText('Brightness')
  })

  it('renders contrast setting button', () => {
    render(mockProps)

    screen.getByText('Contrast')
  })

  it('renders saturation setting button', () => {
    render(mockProps)

    screen.getByText('Saturation')
  })

  it('renders reset settings button', () => {
    render(mockProps)

    screen.getByText('Reset settings to default')
  })

  it('calls setActiveSubView with zoom when zoom button is clicked', () => {
    render(mockProps)

    const zoomButton = screen.getByText('Zoom')
    fireEvent.click(zoomButton)

    expect(mockProps.setActiveSubView).toHaveBeenCalledWith('zoom')
  })

  it('calls setActiveSubView with brightness when brightness button is clicked', () => {
    render(mockProps)

    const brightnessButton = screen.getByText('Brightness')
    fireEvent.click(brightnessButton)

    expect(mockProps.setActiveSubView).toHaveBeenCalledWith('brightness')
  })

  it('calls setActiveSubView with contrast when contrast button is clicked', () => {
    render(mockProps)

    const contrastButton = screen.getByText('Contrast')
    fireEvent.click(contrastButton)

    expect(mockProps.setActiveSubView).toHaveBeenCalledWith('contrast')
  })

  it('calls setActiveSubView with saturation when saturation button is clicked', () => {
    render(mockProps)

    const saturationButton = screen.getByText('Saturation')
    fireEvent.click(saturationButton)

    expect(mockProps.setActiveSubView).toHaveBeenCalledWith('saturation')
  })

  it('calls restoreToDefault when reset button is clicked', () => {
    render(mockProps)

    const resetButton = screen.getByText('Reset settings to default')
    fireEvent.click(resetButton)

    expect(mockSettings.restoreToDefault).toHaveBeenCalledTimes(1)
  })

  it('does not render ImagePreviewModal initially', () => {
    render(mockProps)

    expect(
      screen.queryByText('MOCK_IMAGE_PREVIEW_MODAL')
    ).not.toBeInTheDocument()
  })

  it('calls takePhoto when preview button is clicked', () => {
    const mockTakePhoto = vi.fn()
    vi.mocked(useStubPreviewImage).mockReturnValue({
      isLoading: false,
      imgPath: undefined,
      takePhoto: mockTakePhoto,
    })
    vi.mocked(ChildNavigation).mockImplementation(({ onClickButton }) => (
      <button onClick={onClickButton} data-testid="preview-button">
        Preview
      </button>
    ))

    render(mockProps)

    const previewButton = screen.getByTestId('preview-button')
    fireEvent.click(previewButton)

    expect(mockTakePhoto).toHaveBeenCalledTimes(1)
  })

  it('shows ImagePreviewModal after taking photo', () => {
    const mockTakePhoto = vi.fn()
    vi.mocked(useStubPreviewImage).mockReturnValue({
      isLoading: false,
      imgPath: '/path/to/image.jpg',
      takePhoto: mockTakePhoto,
    })
    vi.mocked(ChildNavigation).mockImplementation(({ onClickButton }) => (
      <button onClick={onClickButton} data-testid="preview-button">
        Preview
      </button>
    ))

    render(mockProps)

    const previewButton = screen.getByTestId('preview-button')
    fireEvent.click(previewButton)

    screen.getByText('MOCK_IMAGE_PREVIEW_MODAL')
  })

  it('shows spinner icon when loading and no image path', () => {
    vi.mocked(useStubPreviewImage).mockReturnValue({
      isLoading: true,
      imgPath: undefined,
      takePhoto: vi.fn(),
    })

    render(mockProps)

    expect(vi.mocked(ChildNavigation)).toHaveBeenCalledWith(
      expect.objectContaining({
        iconName: 'ot-spinner',
        iconPlacement: 'startIcon',
      }),
      {}
    )
  })
})
