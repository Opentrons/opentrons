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
      `fontSize: ${String(TYPOGRAPHY.fontSizeLabel)}`
    )
    expect(getByText('labelSemiBold')).toHaveStyle(
      `fontWeight: ${String(TYPOGRAPHY.fontWeightSemiBold)}`
    )
    expect(getByText('labelSemiBold')).toHaveStyle(
      `lineHeight: ${String(TYPOGRAPHY.lineHeight12)}`
    )
  })
})
