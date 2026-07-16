import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { CommandSteps } from '../../CommandSteps'

import { PlayBackControls } from '../../../molecules/PlayBackControls'
import { DeckView } from '../../DeckView'
import { StepDetailContainer } from '../../StepDetailContainer'
import { ProtocolVisualization } from '../index'

import type { ComponentProps } from 'react'

vi.mock('../../../molecules/PlayBackControls')
vi.mock('../../StepDetailContainer')
vi.mock('../../CommandSteps')
vi.mock('../../DeckView')

const render = (props: ComponentProps<typeof ProtocolVisualization>) => {
  return renderWithProviders(<ProtocolVisualization {...props} />)
}

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

describe('ProtocolVisualization', () => {
  let props: ComponentProps<typeof ProtocolVisualization>

  beforeEach(() => {
    props = {
      analysis: mockAnalysis,
      groupedCommands: [],
    }
    vi.mocked(PlayBackControls).mockReturnValue(<div>mock PlayBackControls</div>)
    vi.mocked(StepDetailContainer).mockReturnValue(
      <div>mock StepDetailContainer</div>
    )
    vi.mocked(CommandSteps).mockReturnValue(<div>mock CommandSteps</div>)
    vi.mocked(DeckView).mockReturnValue(<div>mock DeckView</div>)
  })

  it('should render mock components', () => {
    render(props)
    screen.getByText('mock PlayBackControls')
    screen.getByText('mock CommandSteps')
    screen.getByText('mock DeckView')
  })
})
