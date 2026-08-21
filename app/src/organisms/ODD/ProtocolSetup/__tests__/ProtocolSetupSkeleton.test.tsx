import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ProtocolSetupButtonsSkeleton,
  ProtocolSetupStepSkeleton,
  ProtocolSetupTitleSkeleton,
} from '../ProtocolSetupSkeleton'

describe('ProtocolSetupSkeleton', () => {
  it('renders Skeletons to replace the title section', () => {
    render(<ProtocolSetupTitleSkeleton />)
    const titleSkeletons = screen.getAllByRole('status')
    expect(titleSkeletons.length).toBe(2)

    titleSkeletons.forEach(titleSkeleton => {
      expect(titleSkeleton).toHaveStyle('background-size: 99rem')
    })
  })

  it('renders Skeletons to replace the close and play buttons', () => {
    render(<ProtocolSetupButtonsSkeleton />)
    const buttonSkeletons = screen.getAllByRole('status')
    expect(buttonSkeletons.length).toBe(2)

    buttonSkeletons.forEach(buttonSkeleton => {
      expect(buttonSkeleton).toHaveStyle('background-size: 99rem')
      expect(buttonSkeleton).toHaveStyle('height: 6.25rem')
      expect(buttonSkeleton).toHaveStyle('width: 6.25rem')
    })
  })

  it('renders Skeletons to replace the SetupStep components', () => {
    render(<ProtocolSetupStepSkeleton />)
    const titleSkeletons = screen.getAllByRole('status')
    expect(titleSkeletons.length).toBe(4)

    titleSkeletons.forEach(titleSkeleton => {
      expect(titleSkeleton).toHaveStyle('background-size: 99rem')
    })
  })
})
