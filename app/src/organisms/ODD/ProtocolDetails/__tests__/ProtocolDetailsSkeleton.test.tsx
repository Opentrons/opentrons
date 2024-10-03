import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ProtocolDetailsHeaderChipSkeleton,
  ProcotolDetailsHeaderTitleSkeleton,
  ProtocolDetailsSectionContentSkeleton,
} from '../ProtocolDetailsSkeleton'

describe('ProtocolDetailsSkeleton', () => {
  it('renders a Skeleton to replace the Chip component', () => {
    render(<ProtocolDetailsHeaderChipSkeleton />)
    const chipSkeleton = screen.getAllByTestId('Skeleton')
    expect(chipSkeleton.length).toEqual(1)
    expect(chipSkeleton[0]).toHaveStyle('background-size: 99rem')
  })

  it('renders a Skeleton to replace the title section', () => {
    render(<ProcotolDetailsHeaderTitleSkeleton />)
    const titleSkeleton = screen.getAllByTestId('Skeleton')
    expect(titleSkeleton.length).toEqual(1)
    expect(titleSkeleton[0]).toHaveStyle('background-size: 99rem')
  })

  it('renders Skeletons to replace the ProtocolSectionContent component', () => {
    render(<ProtocolDetailsSectionContentSkeleton />)
    const contentSkeletons = screen.getAllByTestId('Skeleton')
    expect(contentSkeletons.length).toEqual(5)
    contentSkeletons.forEach(contentSkeleton => {
      expect(contentSkeleton).toHaveStyle('background-size: 99rem')
    })
  })
})
