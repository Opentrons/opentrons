import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../__testing-utils__'
import { AnnotatedGroup } from '../AnnotatedGroup'
import { IndividualCommand } from '../IndividualCommand'

import type { ComponentProps } from 'react'
import type { PipettingRunTimeCommand } from '@opentrons/shared-data'

vi.mock('../IndividualCommand')

const mockSubCommand: PipettingRunTimeCommand = {
  id: 'mockCommandId',
  status: 'succeeded',
  createdAt: '2026-01-01T00:00:00Z',
  startedAt: '2026-01-01T00:00:01Z',
  completedAt: '2026-01-01T00:00:02Z',
  commandType: 'configureForVolume',
  params: {
    pipetteId: 'mockPipetteId',
    volume: 10,
  },
}

const mockHandlePause = vi.fn()

const render = (props: ComponentProps<typeof AnnotatedGroup>) => {
  return renderWithProviders(<AnnotatedGroup {...props} />)
}

describe('AnnotatedGroup', () => {
  let props: ComponentProps<typeof AnnotatedGroup>

  beforeEach(() => {
    props = {
      scrollTargetId: 'mockTargetId',
      listElement: null,
      listViewportHeight: 0,
      annotationType: 'mockAnnotationType',
      annotationDescription: 'mockAnnotationDescription',
      subCommands: [],
      analysis: {} as any,
      allRunDefs: [] as any,
      commandStartNumber: 1,
      setSelectedCommand: vi.fn(),
      handlePause: mockHandlePause,
    }
    vi.mocked(IndividualCommand).mockReturnValue(
      <div>mockIndividualCommand</div>
    )
  })

  it('should render text and icon', () => {
    render(props)
    screen.getByText('mockAnnotationType')
    expect(screen.queryByText('mockIndividualCommand')).toBeNull()
  })

  it('should render individual command component', () => {
    props = {
      ...props,
      subCommands: [
        {
          command: mockSubCommand,
          isHighlighted: true,
        },
      ],
    }
    render(props)
    screen.getByText('mockIndividualCommand')
  })
})
