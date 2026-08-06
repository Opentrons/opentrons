import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  AdditionalCustomLabwareSourceFolder,
  AuditLogFolder,
  ClearUnavailableRobots,
  EnableDevTools,
  OverridePathToPython,
  PreventRobotCaching,
  ShowHeaterShakerAttachmentModal,
  ShowLabwareOffsetSnippets,
  UpdatedChannel,
} from '/app/organisms/Desktop/AdvancedSettings'

import { AdvancedSettings } from '../AdvancedSettings'

vi.mock('/app/redux/config')
vi.mock('/app/redux/calibration')
vi.mock('/app/redux/custom-labware')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/protocol-analysis')
vi.mock('/app/redux/system-info')
vi.mock('@opentrons/components/src/hooks')
vi.mock('/app/redux/analytics')
vi.mock('/app/organisms/Desktop/AdvancedSettings')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(
    <MemoryRouter>
      <AdvancedSettings />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('AdvancedSettings', () => {
  beforeEach(() => {
    vi.mocked(PreventRobotCaching).mockReturnValue(
      <div>mock PreventRobotCaching</div>
    )
    vi.mocked(EnableDevTools).mockReturnValue(<div>mock EnableDevTools</div>)
    vi.mocked(ShowLabwareOffsetSnippets).mockReturnValue(
      <div>mock ShowLabwareOffsetSnippets</div>
    )
    vi.mocked(ClearUnavailableRobots).mockReturnValue(
      <div>mock ClearUnavailableRobots</div>
    )
    vi.mocked(OverridePathToPython).mockReturnValue(
      <div>mock OverridePathToPython</div>
    )
    vi.mocked(ShowHeaterShakerAttachmentModal).mockReturnValue(
      <div>mock ShowHeaterShakerAttachmentModal</div>
    )
    vi.mocked(UpdatedChannel).mockReturnValue(<div>mock UpdatedChannel</div>)
    vi.mocked(AdditionalCustomLabwareSourceFolder).mockReturnValue(
      <div>mock AdditionalCustomLabwareSourceFolder</div>
    )
    vi.mocked(AuditLogFolder).mockReturnValue(<div>mock AuditLogFolder</div>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render mock UpdatedChannel section', () => {
    render()
    screen.getByText('mock UpdatedChannel')
  })

  it('should render mock OT-2 Advanced Settings Tip Length Calibration Method section', () => {
    render()
    screen.getByText('mock AdditionalCustomLabwareSourceFolder')
  })

  it('should render mock AuditLogFolder section', () => {
    render()
    screen.getByText('mock AuditLogFolder')
  })

  it('should render mock robot caching section', () => {
    render()
    screen.getByText('mock PreventRobotCaching')
  })

  it('should render mock show link to get labware offset data section', () => {
    render()
    screen.getByText('mock ShowLabwareOffsetSnippets')
  })

  it('should render mock ShowHeaterShakerAttachmentModal section', () => {
    render()
    screen.getByText('mock ShowHeaterShakerAttachmentModal')
  })

  it('should render mock OverridePathToPython section', () => {
    render()
    screen.getByText('mock OverridePathToPython')
  })

  it('should render mock clear unavailable robots section', () => {
    render()
    screen.getByText('mock ClearUnavailableRobots')
  })

  it('should render mock developer tools section', () => {
    render()
    screen.getByText('mock EnableDevTools')
  })
})
