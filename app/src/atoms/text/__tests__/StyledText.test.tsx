import * as React from 'react'
import { TYPOGRAPHY, renderWithProviders } from '@opentrons/components'
import { StyledText } from '../'

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
    const { getByText } = render(props)
    expect(getByText('h1Default')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH1)}`
    )
    expect(getByText('h1Default')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('h1Default')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight24)}`
    )
  })

  it('should render h2 regular style', () => {
    props = {
      as: 'h2',
      children: 'h2Regular',
    }
    const { getByText } = render(props)
    expect(getByText('h2Regular')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH2)}`
    )
    expect(getByText('h2Regular')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(getByText('h2Regular')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render h3 regular style', () => {
    props = {
      as: 'h3',
      children: 'h3Regular',
    }
    const { getByText } = render(props)
    expect(getByText('h3Regular')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH3)}`
    )
    expect(getByText('h3Regular')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(getByText('h3Regular')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render h6 default style', () => {
    props = {
      as: 'h6',
      children: 'h6Default',
    }
    const { getByText } = render(props)
    expect(getByText('h6Default')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH6)}`
    )
    expect(getByText('h6Default')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(getByText('h6Default')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight12)}`
    )
    expect(getByText('h6Default')).toHaveStyle(
      `textTransform: ${String(TYPOGRAPHY.textTransformUppercase)}`
    )
  })

  it('should render p regular style', () => {
    props = {
      as: 'p',
      children: 'pRegular',
    }
    const { getByText } = render(props)
    expect(getByText('pRegular')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeP)}`
    )
    expect(getByText('pRegular')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(getByText('pRegular')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render label regular style', () => {
    props = {
      as: 'label',
      children: 'labelRegular',
    }
    const { getByText } = render(props)
    expect(getByText('labelRegular')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeLabel)}`
    )
    expect(getByText('labelRegular')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightRegular)}`
    )
    expect(getByText('labelRegular')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight12)}`
    )
  })

  it('should render h2 semibold style', () => {
    props = {
      as: 'h2SemiBold',
      children: 'h2SemiBold',
    }
    const { getByText } = render(props)
    expect(getByText('h2SemiBold')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH2)}`
    )
    expect(getByText('h2SemiBold')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('h2SemiBold')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render h3 semibold style', () => {
    props = {
      as: 'h3SemiBold',
      children: 'h3SemiBold',
    }
    const { getByText } = render(props)
    expect(getByText('h3SemiBold')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH3)}`
    )
    expect(getByText('h3SemiBold')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('h3SemiBold')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render h6 semibold style', () => {
    props = {
      as: 'h6SemiBold',
      children: 'h6SemiBold',
    }
    const { getByText } = render(props)
    expect(getByText('h6SemiBold')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeH6)}`
    )
    expect(getByText('h6SemiBold')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('h6SemiBold')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight12)}`
    )
  })

  it('should render p semibold style', () => {
    props = {
      as: 'pSemiBold',
      children: 'pSemiBold',
    }
    const { getByText } = render(props)
    expect(getByText('pSemiBold')).toHaveStyle(
      `fontSize: ${String(TYPOGRAPHY.fontSizeP)}`
    )
    expect(getByText('pSemiBold')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('pSemiBold')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight20)}`
    )
  })

  it('should render label semibold style', () => {
    props = {
      as: 'labelSemiBold',
      children: 'labelSemiBold',
    }
    const { getByText } = render(props)
    expect(getByText('labelSemiBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSizeLabel}`
    )
    expect(getByText('labelSemiBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightSemiBold}`
    )
    expect(getByText('labelSemiBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight12}`
    )
  })

  it('should render header level 2 bold style', () => {
    props = {
      as: 'h2Bold',
      children: 'h2Bold',
    }
    const { getByText } = render(props)
    expect(getByText('h2Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize38}`
    )
    expect(getByText('h2Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(getByText('h2Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight48}`
    )
  })

  it('should render header level 3 bold style', () => {
    props = {
      as: 'h3Bold',
      children: 'h3Bold',
    }
    const { getByText } = render(props)
    expect(getByText('h3Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize32}`
    )
    expect(getByText('h3Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(getByText('h3Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight42}`
    )
  })

  it('should render header level 4 bold style', () => {
    props = {
      as: 'h4Bold',
      children: 'h4Bold',
    }
    const { getByText } = render(props)
    expect(getByText('h4Bold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize28}`
    )
    expect(getByText('h4Bold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(getByText('h4Bold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight36}`
    )
  })

  it('should render p bold style - bodyText bold', () => {
    props = {
      as: 'pBold',
      children: 'pBold',
    }
    const { getByText } = render(props)
    expect(getByText('pBold')).toHaveStyle(`fontSize: ${TYPOGRAPHY.fontSize22}`)
    expect(getByText('pBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(getByText('pBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight28}`
    )
  })

  it('should render label bold style - smallBodyText bold', () => {
    props = {
      as: 'labelBold',
      children: 'labelBold',
    }
    const { getByText } = render(props)
    expect(getByText('labelBold')).toHaveStyle(
      `fontSize: ${TYPOGRAPHY.fontSize20}`
    )
    expect(getByText('labelBold')).toHaveStyle(
      `fontWeight: ${TYPOGRAPHY.fontWeightBold}`
    )
    expect(getByText('labelBold')).toHaveStyle(
      `lineHeight: ${TYPOGRAPHY.lineHeight24}`
    )
  })
})
