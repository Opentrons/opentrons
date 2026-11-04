import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { CommandSteps } from '/app/organisms/Desktop/ProtocolVisualization/CommandSteps'
import { Controls } from '/app/organisms/Desktop/ProtocolVisualization/Controls'
import { DeckView } from '/app/organisms/Desktop/ProtocolVisualization/DeckView'

import { VisualizerContainer } from '../../../../../organisms/Desktop/ProtocolVisualization/VisualizerContainer'
import { StepDetailContainer } from '../../StepDetailContainer'

import type { ComponentProps } from 'react'
import type { State } from '/app/redux/types'

vi.mock('/app/organisms/Desktop/ProtocolVisualization/Controls')
vi.mock('/app/organisms/Desktop/ProtocolVisualization/StepDetailContainer')
vi.mock('/app/organisms/Desktop/ProtocolVisualization/CommandSteps')
vi.mock('/app/organisms/Desktop/ProtocolVisualization/DeckView')

const render = (props: ComponentProps<typeof VisualizerContainer>) => {
  return renderWithProviders<State>(<VisualizerContainer {...props} />, {
    initialState: {
      shell: {
        stepDetailViewerClosed: null,
      },
    } as State,
    i18nInstance: i18n,
  })[0]
}

const mockProtocolKey = 'mockProtocolKey'
const mockSrcFileNames = ['mockFile.py']

const mockAnalysis = {
  createdAt: '2025-10-21T21:19:44.432392Z',
  files: [
    {
      name: 'mockFile.py',
      role: 'main',
    },
    {
      name: '12x125ml_update.json',
      role: 'labware',
    },
  ],
  config: {
    protocolType: 'python',
    apiVersion: [2, 26],
  },
  metadata: {
    protocolName: 'mock protocol',
    author: 'test',
    description: 'mock protocol',
    created: '2025-10-16T22:43:10.289Z',
    lastModified: '2025-10-16T23:07:43.336Z',
    protocolDesigner:
      'protocol-designer@chore_release-pd-8.6.0-20251016-222252',
    source: 'Protocol Designer',
  },
  modules: [],
  labware: [],
  pipettes: [],
  liquids: [],
  result: 'ok',
  robotType: 'OT-3 Standard',
  runTimeParameters: [],
  commands: [
    {
      id: '3bf9268c-c37c-4d62-a248-a1688816ba1f',
      createdAt: '2025-10-21T21:19:44.407651Z',
      commandType: 'home',
      key: '50c7ae73a4e3f7129874f39dfb514803',
      status: 'succeeded',
      params: {},
      result: {},
      startedAt: '2025-10-21T21:19:44.408338Z',
      completedAt: '2025-10-21T21:19:44.408410Z',
      notes: [],
    },
  ],
  errors: [],
  commandAnnotations: [],
} as any

describe('VisualizerContainer', () => {
  let props: ComponentProps<typeof VisualizerContainer>

  beforeEach(() => {
    props = {
      analysisOutput: mockAnalysis,
      runId: null,
      groupedCommands: [],
      protocolKey: mockProtocolKey,
      srcFileNames: mockSrcFileNames,
    }
    vi.mocked(Controls).mockReturnValue(<div>mock Controls</div>)
    vi.mocked(StepDetailContainer).mockReturnValue(
      <div>mock StepDetailContainer</div>
    )
    vi.mocked(CommandSteps).mockReturnValue(<div>mock CommandSteps</div>)
    vi.mocked(DeckView).mockReturnValue(<div>mock DeckView</div>)
  })

  it('should render mock components', () => {
    render(props)
    screen.getByText('mock Controls')
    screen.getByText('mock StepDetailContainer')
    screen.getByText('mock CommandSteps')
    screen.getByText('mock DeckView')
  })
})
