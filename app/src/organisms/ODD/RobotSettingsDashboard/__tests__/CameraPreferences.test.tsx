import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { CameraSettings } from '/app/organisms/ODD/CameraSettings'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { CameraPreferences } from '../CameraPreferences'

import type { CameraPreferencesProps } from '../CameraPreferences'

vi.mock('/app/organisms/ODD/CameraSettings')
vi.mock('/app/organisms/ODD/ChildNavigation')

vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

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
      robotName: 'robotName',
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
