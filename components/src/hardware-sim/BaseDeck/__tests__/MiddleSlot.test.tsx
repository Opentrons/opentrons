import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MiddleSlot } from '../MiddleSlot'

describe('MiddleSlot', () => {
  const defaultProps = {
    showSlotClips: true,
    fixtureBaseColor: 'red',
    slotClipColor: 'blue',
    stroke: 'black',
  }

  it('renders SlotBase with correct props', () => {
    render(
      <svg>
        <MiddleSlot {...defaultProps} />
      </svg>
    )

    const base = screen.getByTestId('slot-base')

    expect(base).toBeInTheDocument()
    expect(base).toHaveAttribute('fill', 'red')
    expect(base).toHaveAttribute('stroke', 'black')
  })

  it('renders slot clips when showSlotClips is true', () => {
    render(
      <svg>
        <MiddleSlot {...defaultProps} />
      </svg>
    )

    const clipPaths = screen.getAllByTestId('slot-clip')
    expect(clipPaths).toHaveLength(4)
  })

  it('does not render slot clips when showSlotClips is false', () => {
    render(
      <svg>
        <MiddleSlot {...defaultProps} showSlotClips={false} />
      </svg>
    )

    const clipPaths = screen.queryAllByTestId('slot-clip')
    expect(clipPaths).toHaveLength(0)
  })

  it('passes slotClipColor to SlotClip stroke', () => {
    render(
      <svg>
        <MiddleSlot {...defaultProps} />
      </svg>
    )

    const clipPaths = screen.getAllByTestId('slot-clip')

    clipPaths.forEach(clip => {
      expect(clip).toHaveAttribute('stroke', 'blue')
    })
  })
})
