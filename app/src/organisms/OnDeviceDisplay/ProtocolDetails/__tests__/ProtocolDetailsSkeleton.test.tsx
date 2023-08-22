import * as React from 'react'

import { render } from '@testing-library/react'

import {
  ProtocolDetailsHeaderChipSkeleton,
  ProcotolDetailsHeaderTitleSkeleton,
  ProtocolDetailsSectionContentSkeleton,
} from '../ProtocolDetailsSkeleton'

describe('ProtocolDetailsSkeleton', () => {
  it('renders a Skeleton to replace the Chip component', () => {
    const { getAllByTestId } = render(<ProtocolDetailsHeaderChipSkeleton />)
    const chipSkeleton = getAllByTestId('Skeleton')
    expect(chipSkeleton.length).toEqual(1)
    expect(chipSkeleton[0]).toHaveStyle('background-size: 99rem')
  })

  it('renders a Skeleton to replace the title section', () => {
    const { getAllByTestId } = render(<ProcotolDetailsHeaderTitleSkeleton />)
    const titleSkeleton = getAllByTestId('Skeleton')
    expect(titleSkeleton.length).toEqual(1)
    expect(titleSkeleton[0]).toHaveStyle('background-size: 99rem')
  })

  it('renders Skeletons to replace the ProtocolSectionContent component', () => {
    const { getAllByTestId } = render(<ProtocolDetailsSectionContentSkeleton />)
    const contentSkeletons = getAllByTestId('Skeleton')
    expect(contentSkeletons.length).toEqual(5)
    contentSkeletons.forEach(contentSkeleton => {
      expect(contentSkeleton).toHaveStyle('background-size: 99rem')
    })
  })
})
