import * as React from 'react'

import { COLORS, renderWithProviders } from '@opentrons/components'

import { Chip } from '..'

const render = (props: React.ComponentProps<typeof Chip>) => {
  return renderWithProviders(<Chip {...props} />)
}

describe('Chip', () => {
  let props: React.ComponentProps<typeof Chip>

  it('should render text, no icon with basic colors', () => {
    props = {
      type: 'basic',
      text: 'mockBasic',
    }
    const [{ getByText, queryByLabelText }] = render(props)
    const chip = getByText('mockBasic')
    expect(chip).toHaveStyle(`color: ${String(COLORS.darkBlack_ninety)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.darkBlack_twenty)}`)
    expect(queryByLabelText('icon_mockBasic')).not.toBeInTheDocument()
  })

  it('should render text, icon, bgcolor with success colors', () => {
    props = {
      type: 'success',
      text: 'mockSuccess',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockSuccess')
    expect(chip).toHaveStyle(`color: ${String(COLORS.green_one)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.green_three)}`)
    const icon = getByLabelText('icon_mockSuccess')
    expect(icon).toHaveStyle(`color: ${String(COLORS.green_one)}`)
  })

  it('should render text, icon, no bgcolor with success colors and bg false', () => {
    props = {
      background: false,
      type: 'success',
      text: 'mockSuccess',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockSuccess')
    expect(chip).toHaveStyle(`color: ${String(COLORS.green_one)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.transparent)}`)
    const icon = getByLabelText('icon_mockSuccess')
    expect(icon).toHaveStyle(`color: ${String(COLORS.green_one)}`)
  })

  it('should render text, icon, bgcolor with warning colors', () => {
    props = {
      type: 'warning',
      text: 'mockWarning',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockWarning')
    expect(chip).toHaveStyle(`color: ${String(COLORS.yellow_one)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.yellow_three)}`)
    const icon = getByLabelText('icon_mockWarning')
    expect(icon).toHaveStyle(`color: ${String(COLORS.yellow_two)}`)
  })

  it('should render text, icon, no bgcolor with warning colors and bg false', () => {
    props = {
      type: 'warning',
      text: 'mockWarning',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockWarning')
    expect(chip).toHaveStyle(`color: ${String(COLORS.yellow_one)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.transparent)}`)
    const icon = getByLabelText('icon_mockWarning')
    expect(icon).toHaveStyle(`color: ${String(COLORS.yellow_two)}`)
  })

  it('should render text, icon, bgcolor with neutral colors', () => {
    props = {
      type: 'neutral',
      text: 'mockNeutral',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockNeutral')
    expect(chip).toHaveStyle(`color: ${String(COLORS.darkBlack_seventy)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.darkBlack_twenty)}`)
    const icon = getByLabelText('icon_mockNeutral')
    expect(icon).toHaveStyle(`color: ${String(COLORS.darkBlack_ninety)}`)
  })

  it('should render text, icon, no bgcolor with neutral colors and bg false', () => {
    props = {
      type: 'neutral',
      text: 'mockNeutral',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockNeutral')
    expect(chip).toHaveStyle(`color: ${String(COLORS.darkBlack_seventy)}`)
    // expect(chip).toHaveStyle(`background-color: ${String(COLORS.transparent)}`)
    const icon = getByLabelText('icon_mockNeutral')
    expect(icon).toHaveStyle(`color: ${String(COLORS.darkBlack_ninety)}`)
  })
})
