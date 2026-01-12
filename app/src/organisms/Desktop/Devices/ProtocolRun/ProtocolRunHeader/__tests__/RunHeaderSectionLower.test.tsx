import { useNavigate } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { when } from 'vitest-when'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
  useTrackEvent,
} from '/app/redux/analytics'
import { useFeatureFlag } from '/app/redux/config'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'

import { RunHeaderSectionLower } from '../RunHeaderContent/RunHeaderSectionLower'

import type { ComponentProps } from 'react'

vi.mock('react-router-dom')
vi.mock('/app/redux/config')
vi.mock('/app/resources/analysis/hooks/useStoredProtocolAnalysis')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/redux/analytics')

const mockRunId = 'mockRunId'
const mockRobotName = 'mockRobotName'
const mockMakeSnackbar = vi.fn()
const mockNavigate = vi.fn()
const PIPETTES = [
  { id: '1', pipetteName: 'testModelLeft' },
  { id: '2', pipetteName: 'testModelRight' },
]
const MODULES = {
  module1: { model: 'module1' },
  module2: { model: 'module2' },
}
const RUNTIME_PARAMETERS = [
  {
    displayName: 'test param',
    variableName: 'test_param',
    description: 'Mock boolean parameter',
    type: 'bool',
    default: true,
    value: true,
  },
]
const STORED_PROTOCOL_ANALYSIS = {
  config: { protocolType: 'json', schemaVersion: 7 },
  metadata: {
    author: 'testAuthor',
    apiLevel: 2.15,
    protocolName: 'stored protocol',
    source: 'stored protocol source',
  },
  robotType: 'OT-3 Standard',
  pipettes: PIPETTES,
  modules: MODULES,
  runTimeParameters: RUNTIME_PARAMETERS,
}

const render = (props: ComponentProps<typeof RunHeaderSectionLower>) => {
  return renderWithProviders(<RunHeaderSectionLower {...props} />, {
    i18nInstance: i18n,
  })
}
let mockTrackEvent: Mock

describe('RunHeaderSectionLower', () => {
  let props: ComponentProps<typeof RunHeaderSectionLower>
  beforeEach(() => {
    props = {
      ...props,
      runId: mockRunId,
      runStatus: null,
      robotName: mockRobotName,
    }
    vi.mocked(useToaster).mockReturnValue({
      makeSnackbar: mockMakeSnackbar,
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(false)
    mockTrackEvent = vi.fn()
    when(vi.mocked(useTrackEvent)).calledWith().thenReturn(mockTrackEvent)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render text', () => {
    render(props)
    screen.getByText('Protocol start')
    screen.getByText('Protocol end')
    expect(
      screen.queryByRole('button', { name: 'Visualize' })
    ).not.toBeInTheDocument()
  })

  it('should render visualize button when runStatus is idle', () => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(true)
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    screen.getByRole('button', { name: 'Visualize' })
  })

  it('should call makeSnackbar when protocol is not supported python protocol', () => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(true)
    const nonSupportedProtocolAnalysis = {
      ...STORED_PROTOCOL_ANALYSIS,
      config: {
        ...STORED_PROTOCOL_ANALYSIS.config,
        protocolType: 'python',
        apiVersion: [2, 13],
      },
    }
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(mockRunId)
      .thenReturn(nonSupportedProtocolAnalysis as any)
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Visualize' }))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      "Can't visualize. Update protocol to API level 2.14 or higher."
    )
  })

  it('should call makeSnackbar when protocol is not supported json protocol', () => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(true)
    const nonSupportedProtocolAnalysis = {
      ...STORED_PROTOCOL_ANALYSIS,
      config: {
        ...STORED_PROTOCOL_ANALYSIS.config,
        schemaVersion: 5,
      },
    }
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(mockRunId)
      .thenReturn(nonSupportedProtocolAnalysis as any)
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Visualize' }))
    expect(mockMakeSnackbar).toHaveBeenCalledWith(
      "Can't visualize. Re-export from Protocol Designer."
    )
  })

  it('should call mock function when clicking visualize button', () => {
    when(vi.mocked(useFeatureFlag))
      .calledWith('protocolTimeline')
      .thenReturn(true)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(mockRunId)
      .thenReturn(STORED_PROTOCOL_ANALYSIS as any)
    props = {
      ...props,
      runStatus: RUN_STATUS_IDLE,
    }
    render(props)
    fireEvent.click(screen.getByRole('button', { name: 'Visualize' }))
    expect(mockNavigate).toHaveBeenCalledWith(
      '/devices/mockRobotName/mockRunId/--%3A--%3A--/null/visualization'
    )
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
      properties: {sourceLocation: 'protocol run'},
    })
  })
})
