import * as React from 'react'

import { render } from '@testing-library/react'

import {
  ProtocolSetupTitleSkeleton,
  ProtocolSetupStepSkeleton,
} from '../ProtocolSetupSkeleton'

describe('ProtocolSetupSkeleton', () => {
  it('renders Skeletons to replace the title section', () => {
    const { getAllByTestId } = render(<ProtocolSetupTitleSkeleton />)
    const titleSkeletons = getAllByTestId('Skeleton')
    expect(titleSkeletons.length).toBe(2)

    titleSkeletons.forEach(titleSkeleton => {
      expect(titleSkeleton).toHaveStyle('background-size: 99rem')
    })
  })

  it('renders Skeletons to replace the SetupStep components', () => {
    const { getAllByTestId } = render(<ProtocolSetupStepSkeleton />)
    const titleSkeletons = getAllByTestId('Skeleton')
    expect(titleSkeletons.length).toBe(5)

    titleSkeletons.forEach(titleSkeleton => {
      expect(titleSkeleton).toHaveStyle('background-size: 99rem')
    })
  })
})
