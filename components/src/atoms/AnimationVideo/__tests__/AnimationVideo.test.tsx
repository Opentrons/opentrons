import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AnimationVideo } from '..'

describe('AnimationVideo', () => {
  it('should have default props', () => {
    render(<AnimationVideo data-testid="subject" />)
    const videoNode = screen.getByTestId('subject')
    expect(videoNode).toHaveAttribute('autoplay')
    expect(videoNode).toHaveAttribute('loop')
    expect(videoNode).not.toHaveAttribute('controls')
    expect((videoNode as HTMLVideoElement).muted).toBeTruthy()
  })

  it('should merge default props with custom props', () => {
    render(<AnimationVideo data-testid="subject" preload="auto" loop={false} />)
    const videoNode = screen.getByTestId('subject')
    expect(videoNode).toHaveAttribute('autoplay')
    expect(videoNode).not.toHaveAttribute('loop') // Default overridden by custom.
    expect(videoNode).not.toHaveAttribute('controls')
    expect((videoNode as HTMLVideoElement).muted).toBeTruthy()
    expect(videoNode).toHaveAttribute('preload', 'auto') // Custom-only.
  })

  it('should render children', () => {
    render(
      <AnimationVideo>
        <source data-testid="source1"></source>
        <source data-testid="source2"></source>
      </AnimationVideo>
    )
    screen.getByTestId('source1')
    screen.getByTestId('source2')
  })
})
