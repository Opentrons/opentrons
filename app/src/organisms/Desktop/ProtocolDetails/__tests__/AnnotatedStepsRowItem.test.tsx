import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { AnnotatedStepsRowItem } from '../AnnotatedSteps/AnnotatedStepsRowItem'

import type { RowComponentProps } from 'react-window'
import type { ItemData } from '../AnnotatedSteps'

vi.mock('../AnnotatedSteps/AnnotatedGroup', () => ({
  AnnotatedGroup: () => <div>mock AnnotatedGroup</div>,
}))

vi.mock('../AnnotatedSteps/IndividualCommand', () => ({
  IndividualCommand: () => <div>mock IndividualCommand</div>,
}))

describe('AnnotatedStepsRowItem', () => {
  let props: RowComponentProps<ItemData>

  const baseItemData: ItemData = {
    rows: [],
    analysis: { commands: [], errors: [], commandAnnotations: [] } as any,
    allRunDefs: [],
    scrollTargetId: null,
    listElement: null,
    listViewportHeight: 0,
    onShowErrorDetails: vi.fn(),
    t: (key: string) => key,
    milliSecondsPerFrame: 2000,
    isGlobalPlaying: false,
  }

  const buildProps = (
    data: ItemData,
    index = 0
  ): RowComponentProps<ItemData> => ({
    index,
    style: { height: 10 },
    ariaAttributes: {
      role: 'listitem',
      'aria-posinset': index + 1,
      'aria-setsize': data.rows.length,
    },
    ...data,
  })

  beforeEach(() => {
    props = buildProps(baseItemData)
  })

  it('renders a group row', () => {
    props = buildProps({
      ...baseItemData,
      rows: [
        {
          type: 'group',
          group: {
            annotationIndex: 0,
            isHighlighted: false,
            subCommands: [],
          } as any,
          annotationType: 'mock annotation',
          commandStartNumber: 1,
          annotationDescription: '',
        },
      ],
    })

    renderWithProviders(<AnnotatedStepsRowItem {...props} />)
    screen.getByText('mock AnnotatedGroup')
  })

  it('renders a command row', () => {
    props = buildProps({
      ...baseItemData,
      rows: [
        {
          type: 'command',
          command: { id: 'command-id' } as any,
          isHighlighted: false,
          fromGroup: false,
          commandNumber: 1,
        },
      ],
    })

    renderWithProviders(<AnnotatedStepsRowItem {...props} />)
    screen.getByText('mock IndividualCommand')
  })

  it('renders error details and handles click', () => {
    const handleShowErrorDetails = vi.fn()
    props = buildProps({
      ...baseItemData,
      onShowErrorDetails: handleShowErrorDetails,
      rows: [
        {
          type: 'errors',
          errors: [{ id: 'error-id', detail: 'error detail' }] as any,
        },
      ],
    })

    renderWithProviders(<AnnotatedStepsRowItem {...props} />)
    screen.getByText('step_error')
    screen.getByText('error detail')
    screen.getByText('unable_to_show_steps_past_errors')

    fireEvent.click(screen.getByText('error detail'))
    expect(handleShowErrorDetails).toHaveBeenCalled()
  })
})
