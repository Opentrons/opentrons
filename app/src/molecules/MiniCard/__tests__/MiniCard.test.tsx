import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import {
  renderWithProviders,
  COLORS,
  SPACING,
  BORDERS,
} from '@opentrons/components'
import { MiniCard } from '../'

const render = (props: React.ComponentProps<typeof MiniCard>) => {
  return renderWithProviders(<MiniCard {...props} />)[0]
}

describe('MiniCard', () => {
  let props: React.ComponentProps<typeof MiniCard>

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      isSelected: false,
      children: 'mock mini card',
      isError: false,
    }
  })

  it('renders the correct style unselectedOptionStyles', () => {
    const { getByText } = render(props)
    const miniCard = getByText('mock mini card')
    expect(miniCard).toHaveStyle(`background-color: ${COLORS.white}`)
    expect(miniCard).toHaveStyle(`border: 1px solid ${COLORS.medGreyEnabled}`)
    expect(miniCard).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(miniCard).toHaveStyle(`padding: ${SPACING.spacing3}`)
    expect(miniCard).toHaveStyle(`width: 100%`)
    expect(miniCard).toHaveStyle(`cursor: pointer`)
  })

  it('renders the correct style selectedOptionStyles', () => {
    props.isSelected = true
    const { getByText } = render(props)
    const miniCard = getByText('mock mini card')
    expect(miniCard).toHaveStyle(`background-color: ${COLORS.lightBlue}`)
    expect(miniCard).toHaveStyle(`border: 1px solid ${COLORS.blueEnabled}`)
    expect(miniCard).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(miniCard).toHaveStyle(`padding: ${SPACING.spacing3}`)
    expect(miniCard).toHaveStyle(`width: 100%`)
    expect(miniCard).toHaveStyle(`cursor: pointer`)
    expect(miniCard).toHaveStyleRule(
      'border',
      `1px solid ${COLORS.blueEnabled}`,
      {
        modifier: ':hover',
      }
    )
    expect(miniCard).toHaveStyleRule(
      'background-color',
      `${COLORS.lightBlue}`,
      {
        modifier: ':hover',
      }
    )
  })

  it('renders the correct style errorOptionStyles', () => {
    props.isError = true
    props.isSelected = true
    const { getByText } = render(props)
    const miniCard = getByText('mock mini card')
    expect(miniCard).toHaveStyle(`background-color: ${COLORS.errorBackground}`)
    expect(miniCard).toHaveStyle(`border: 1px solid ${COLORS.errorEnabled}`)
    expect(miniCard).toHaveStyle(`border-radius: ${BORDERS.radiusSoftCorners}`)
    expect(miniCard).toHaveStyle(`padding: ${SPACING.spacing3}`)
    expect(miniCard).toHaveStyle(`width: 100%`)
    expect(miniCard).toHaveStyle(`cursor: pointer`)
    expect(miniCard).toHaveStyleRule(
      'border',
      `1px solid ${COLORS.errorEnabled}`,
      {
        modifier: ':hover',
      }
    )
    expect(miniCard).toHaveStyleRule(
      'background-color',
      `${COLORS.errorBackground}`,
      {
        modifier: ':hover',
      }
    )
  })

  it('calls mock function when clicking mini card', () => {
    const { getByText } = render(props)
    const miniCard = getByText('mock mini card')
    fireEvent.click(miniCard)
    expect(props.onClick).toHaveBeenCalled()
  })
})
