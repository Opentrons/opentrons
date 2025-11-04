import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { CameraPreferences } from '../CameraPreferences'

import type { CameraPreferencesProps } from '../CameraPreferences'

vi.mock('/app/organisms/ODD/CameraSettings')
vi.mock('/app/organisms/ODD/ChildNavigation')

const render = (props: CameraPreferencesProps) => {
  return renderWithProviders(<CameraPreferences {...props} />, {
    i18nInstance: i18n,
  })
}

describe('CameraPreferences', () => {
  let mockProps: CameraPreferencesProps

  beforeEach(() => {
    mockProps = {
      setCurrentOption: vi.fn(),
    }
    vi.mocked(CameraSettings).mockReturnValue(<div>MOCK_CAMERA_SETTINGS</div>)
    vi.mocked(ChildNavigation).mockReturnValue(<div>MOCK_CHILD_NAVIGATION</div>)
  })

  it('renders CameraSettings with correct section heading text', () => {
    render(mockProps)

    expect(vi.mocked(CameraSettings)).toHaveBeenCalledWith(
      expect.objectContaining({
        sectionHeadingText:
          'The deck camera offers live video monitoring during protocol runs and supports image capture.',
      }),
      {}
    )
  })

  it('passes headerElement to CameraSettings', () => {
    render(mockProps)

    expect(vi.mocked(CameraSettings)).toHaveBeenCalledWith(
      expect.objectContaining({
        headerElement: expect.anything(),
      }),
      {}
    )
  })
})
