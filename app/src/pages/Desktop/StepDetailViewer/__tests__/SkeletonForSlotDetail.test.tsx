import { it, vi, describe, beforeEach, expect } from 'vitest'
import { Skeleton } from '/app/atoms/Skeleton'
import { renderWithProviders } from '/app/__testing-utils__'
import { screen } from '@testing-library/react'
import { SkeletonForSlotDetail } from '../SkeletonForSlotDetail'

vi.mock('/app/atoms/Skeleton')

const render = () => {
  return renderWithProviders(<SkeletonForSlotDetail/>)
}

describe('SkeletonForSlotDetail', () => {
    beforeEach(() => {
        vi.mocked(Skeleton).mockReturnValue(<div>mock Skeleton</div>)
    })
    it('should render two Skeleton components', () => {
        render()
        expect(screen.getAllByText('mock Skeleton')).toHaveLength(2)
    })
})