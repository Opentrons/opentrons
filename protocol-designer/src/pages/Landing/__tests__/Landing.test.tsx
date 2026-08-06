import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { getHasOptedIn } from '../../../analytics/selectors'
import { i18n } from '../../../assets/localization'
import { useAnnouncements } from '../../../components/organisms/AnnouncementModal/announcements'
import { useKitchen } from '../../../components/organisms/Kitchen/useKitchen'
import { getFileMetadata } from '../../../file-data/selectors'
import { loadProtocolFile } from '../../../load-file/actions'
import { toggleNewProtocolModal } from '../../../navigation/actions'
import { getIsProduction } from '../../../networking/opentronsWebApi'
import { Landing } from '../index'

vi.mock('../../../load-file/actions')
vi.mock('../../../file-data/selectors')
vi.mock('../../../navigation/actions')
vi.mock('../../../networking/opentronsWebApi')
vi.mock('../../../components/organisms/AnnouncementModal/announcements')
vi.mock('../../../components/organisms/Kitchen/useKitchen')
vi.mock('../../../analytics/selectors')
vi.mock('/protocol-designer/feature-flags/selectors')

const mockMakeSnackbar = vi.fn()
const mockEatToast = vi.fn()
const mockBakeToast = vi.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Landing', () => {
  beforeEach(() => {
    vi.mocked(getHasOptedIn).mockReturnValue({
      hasOptedIn: false,
      appVersion: '8.2.1',
    })
    vi.mocked(getFileMetadata).mockReturnValue({})
    vi.mocked(loadProtocolFile).mockReturnValue(vi.fn())
    vi.mocked(useAnnouncements).mockReturnValue({} as any)
    vi.mocked(useKitchen).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      bakeToast: mockBakeToast,
      eatToast: mockEatToast,
    })
    vi.mocked(getIsProduction).mockReturnValue(true)
  })

  it('renders the landing page image and text', () => {
    render()
    screen.getByLabelText('welcome image')
    screen.getByText('Welcome to Protocol Designer!')
    screen.getByText(
      'The easiest way to automate liquid handling on your Opentrons robot. No code required.'
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Create a Flex protocol' })
    )
    expect(vi.mocked(toggleNewProtocolModal)).toHaveBeenCalled()
    screen.getByText('Import existing protocol')
    screen.getByRole('img', { name: 'welcome image' })
  })

  it('render toast when there is an announcement', () => {
    render()
    expect(mockBakeToast).toHaveBeenCalled()
  })

  it('render the button to redirect to OT-2 app and Flex button', () => {
    render()
    screen.getByRole('button', { name: 'Create a Flex protocol' })
    screen.getByRole('button', { name: 'Create an OT-2 protocol' })
  })

  it('calls window.open with the OT-2 redirect URL when Create an OT-2 protocol is clicked', () => {
    const windowOpenSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null)
    vi.mocked(getIsProduction).mockReturnValue(false)
    render()

    fireEvent.click(
      screen.getByRole('button', { name: 'Create an OT-2 protocol' })
    )

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://ot2.staging.designer.opentrons.com/#/createNew',
      '_blank',
      'noopener'
    )
    windowOpenSpy.mockRestore()
  })

  it('calls window.open with the production OT-2 URL when getIsProduction is true', () => {
    const windowOpenSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null)
    render()

    fireEvent.click(
      screen.getByRole('button', { name: 'Create an OT-2 protocol' })
    )

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://ot2.designer.opentrons.com/#/createNew',
      '_blank',
      'noopener'
    )
    windowOpenSpy.mockRestore()
  })
})
