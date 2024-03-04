import * as React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../'
import { renderWithProviders } from '../../../__testing-utils__'

const render = (props: React.ComponentProps<typeof StyledText>) => {
  return renderWithProviders(<StyledText {...props} />)[0]
}

describe('StyledText', () => {
  let props: React.ComponentProps<typeof StyledText>
  // testing styles (font size, font weight, and line height)
  it('should render h1 default style', () => {
    props = {
      as: 'h1',
      children: 'h1Default',
    }
    render(props)
    expect(screen.getByText('h1Default')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH1}`
    )
    expect(screen.getByText('h1Default')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('h1Default')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight24}`
    )
  })

  it('should render h2 regular style', () => {
    props = {
      as: 'h2',
      children: 'h2Regular',
    }
    render(props)
    expect(screen.getByText('h2Regular')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH2}`
    )
    expect(screen.getByText('h2Regular')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(screen.getByText('h2Regular')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render h3 regular style', () => {
    props = {
      as: 'h3',
      children: 'h3Regular',
    }
    render(props)
    expect(screen.getByText('h3Regular')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH3}`
    )
    expect(screen.getByText('h3Regular')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(screen.getByText('h3Regular')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render h6 default style', () => {
    props = {
      as: 'h6',
      children: 'h6Default',
    }
    render(props)
    expect(screen.getByText('h6Default')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH6}`
    )
    expect(screen.getByText('h6Default')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(screen.getByText('h6Default')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight12}`
    )
    expect(screen.getByText('h6Default')).toHaveStyle(
      `textTransform: ${TYPOGRAPHY.textTransformUppercase}`
    )
  })

  it('should render p regular style', () => {
    props = {
      as: 'p',
      children: 'pRegular',
    }
    render(props)
    expect(screen.getByText('pRegular')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeP}`
    )
    expect(screen.getByText('pRegular')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(screen.getByText('pRegular')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render label regular style', () => {
    props = {
      as: 'label',
      children: 'labelRegular',
    }
    render(props)
    expect(screen.getByText('labelRegular')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeLabel}`
    )
    expect(screen.getByText('labelRegular')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightRegular}`
    )
    expect(screen.getByText('labelRegular')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight12}`
    )
  })

  it('should render h2 semibold style', () => {
    props = {
      as: 'h2SemiBold',
      children: 'h2SemiBold',
    }
    render(props)
    expect(screen.getByText('h2SemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH2}`
    )
    expect(screen.getByText('h2SemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('h2SemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render h3 semibold style', () => {
    props = {
      as: 'h3SemiBold',
      children: 'h3SemiBold',
    }
    render(props)
    expect(screen.getByText('h3SemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH3}`
    )
    expect(screen.getByText('h3SemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('h3SemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render h6 semibold style', () => {
    props = {
      as: 'h6SemiBold',
      children: 'h6SemiBold',
    }
    render(props)
    expect(screen.getByText('h6SemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeH6}`
    )
    expect(screen.getByText('h6SemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('h6SemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight12}`
    )
  })

  it('should render p semibold style', () => {
    props = {
      as: 'pSemiBold',
      children: 'pSemiBold',
    }
    render(props)
    expect(screen.getByText('pSemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeP}`
    )
    expect(screen.getByText('pSemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('pSemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight20}`
    )
  })

  it('should render label semibold style', () => {
    props = {
      as: 'labelSemiBold',
      children: 'labelSemiBold',
    }
    render(props)
    expect(screen.getByText('labelSemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeLabel}`
    )
    expect(screen.getByText('labelSemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(screen.getByText('labelSemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight12}`
    )
  })

  it('should render header level 2 bold style', () => {
    props = {
      as: 'h2Bold',
      children: 'h2Bold',
    }
    render(props)
    expect(screen.getByText('h2Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize38}`
    )
    expect(screen.getByText('h2Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(screen.getByText('h2Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight48}`
    )
  })

  it('should render header level 3 bold style', () => {
    props = {
      as: 'h3Bold',
      children: 'h3Bold',
    }
    render(props)
    expect(screen.getByText('h3Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize32}`
    )
    expect(screen.getByText('h3Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(screen.getByText('h3Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight42}`
    )
  })

  it('should render header level 4 bold style', () => {
    props = {
      as: 'h4Bold',
      children: 'h4Bold',
    }
    render(props)
    expect(screen.getByText('h4Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize28}`
    )
    expect(screen.getByText('h4Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(screen.getByText('h4Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight36}`
    )
  })

  it('should render p bold style - bodyText bold', () => {
    props = {
      as: 'pBold',
      children: 'pBold',
    }
    render(props)
    expect(screen.getByText('pBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize22}`
    )
    expect(screen.getByText('pBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(screen.getByText('pBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight28}`
    )
  })

  it('should render label bold style - smallBodyText bold', () => {
    props = {
      as: 'labelBold',
      children: 'labelBold',
    }
    render(props)
    expect(screen.getByText('labelBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize20}`
    )
    expect(screen.getByText('labelBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(screen.getByText('labelBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight24}`
    )
  })
})
