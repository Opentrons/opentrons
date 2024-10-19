import { describe, it, vi, beforeEach, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { AnnouncementModal } from '../../../organisms'
import { i18n } from '../../../assets/localization'
import { renderWithProviders } from '../../../__testing-utils__'
import { getHasOptedIn } from '../../../analytics/selectors'
import { getFeatureFlagData } from '../../../feature-flags/selectors'
import { getCanClearHintDismissals } from '../../../tutorial/selectors'
import { clearAllHintDismissals } from '../../../tutorial/actions'
import { optIn } from '../../../analytics/actions'
import { setFeatureFlags } from '../../../feature-flags/actions'
import { Settings } from '..'

vi.mock('../../../organisms')
vi.mock('../../../feature-flags/actions')
vi.mock('../../../analytics/actions')
vi.mock('../../../tutorial/actions')
vi.mock('../../../tutorial/selectors')
vi.mock('../../../feature-flags/selectors')
vi.mock('../../../analytics/selectors')
const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Settings', () => {
  beforeEach(() => {
    vi.mocked(getHasOptedIn).mockReturnValue(false)
    vi.mocked(getFeatureFlagData).mockReturnValue({})
    vi.mocked(getCanClearHintDismissals).mockReturnValue(true)
  })
  it('renders the settings page without the dev ffs visible', () => {
    render()
    screen.getByText('Settings')
    screen.getByText('App settings')
    screen.getByText('Protocol designer version')
    screen.getByText('fake_PD_version')
    screen.getAllByText('View release notes')
    screen.getByText('User settings')
    screen.getByText('Hints')
    screen.getByText('Reset all hints and tips notifications')
    screen.getByText('Timeline editing tips')
    screen.getByText(
      'Show tips for working with steps next to the protocol timeline'
    )
    screen.getByText('Reset hints')
    screen.getByText('Privacy')
    screen.getByText('Share sessions with Opentrons')
    screen.debug()
    screen.getByRole('link', { name: 'privacy policy' })
    screen.getByRole('link', { name: 'EULA' })
  })
  it('renders the announcement modal when view release notes button is clicked', () => {
    vi.mocked(AnnouncementModal).mockReturnValue(
      <div>mock AnnouncementModal</div>
    )
    render()
    fireEvent.click(
      screen.getByTestId('AnnouncementModal_viewReleaseNotesButton')
    )
    screen.getByText('mock AnnouncementModal')
  })
  it('renders the hints button and calls to dismiss them when text is pressed', () => {
    render()
    fireEvent.click(screen.getByText('Reset hints'))
    expect(vi.mocked(clearAllHintDismissals)).toHaveBeenCalled()
  })
  it('renders the analytics toggle and calls the action when pressed', () => {
    render()
    fireEvent.click(screen.getByTestId('analyticsToggle'))
    expect(vi.mocked(optIn)).toHaveBeenCalled()
  })
  it('renders the dev ffs section when prerelease mode is turned on', () => {
    vi.mocked(getFeatureFlagData).mockReturnValue({
      PRERELEASE_MODE: true,
      OT_PD_DISABLE_MODULE_RESTRICTIONS: true,
    })

    render()
    screen.getByText('Developer feature flags')
    screen.getByText('Use prerelease mode')
    screen.getByText('Show in-progress features for testing & internal use')
    screen.getByText('Disable module placement restrictions')
    screen.getByText(
      'Turn off all restrictions on module placement and related pipette crash guidance.'
    )
    fireEvent.click(screen.getByLabelText('Settings_PRERELEASE_MODE'))
    expect(vi.mocked(setFeatureFlags)).toHaveBeenCalled()
  })
})
