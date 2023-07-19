import * as React from 'react'

import { BORDERS, COLORS, renderWithProviders } from '@opentrons/components'

import { Chip } from '..'

const render = (props: React.ComponentProps<typeof Chip>) => {
  return renderWithProviders(<Chip {...props} />)
}

describe('Chip', () => {
  let props: React.ComponentProps<typeof Chip>

  it('should render text, no icon with basic colors', () => {
    props = {
      text: 'mockBasic',
      type: 'basic',
    }
    const [{ getByTestId, getByText, queryByLabelText }] = render(props)
    const chip = getByTestId('Chip_basic')
    const chipText = getByText('mockBasic')
    expect(chip).toHaveStyle(`background-color: ${COLORS.darkBlack20}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.darkBlack90}`)
    expect(queryByLabelText('icon_mockBasic')).not.toBeInTheDocument()
  })

  it('should render text, icon, bgcolor with success colors', () => {
    props = {
      text: 'mockSuccess',
      type: 'success',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_success')
    const chipText = getByText('mockSuccess')
    expect(chip).toHaveStyle(`background-color: ${COLORS.green3}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.green1}`)
    const icon = getByLabelText('icon_mockSuccess')
    expect(icon).toHaveStyle(`color: ${COLORS.green1}`)
  })

  it('should render text, icon, no bgcolor with success colors and bg false', () => {
    props = {
      background: false,
      text: 'mockSuccess',
      type: 'success',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_success')
    const chipText = getByText('mockSuccess')
    expect(chip).toHaveStyle(`background-color: ${COLORS.transparent}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.green1}`)
    const icon = getByLabelText('icon_mockSuccess')
    expect(icon).toHaveStyle(`color: ${COLORS.green1}`)
  })

  it('should render text, icon, bgcolor with warning colors', () => {
    props = {
      text: 'mockWarning',
      type: 'warning',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_warning')
    const chipText = getByText('mockWarning')
    expect(chip).toHaveStyle(`background-color: ${COLORS.yellow3}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.yellow1}`)
    const icon = getByLabelText('icon_mockWarning')
    expect(icon).toHaveStyle(`color: ${COLORS.yellow1}`)
  })

  it('should render text, icon, no bgcolor with warning colors and bg false', () => {
    props = {
      background: false,
      text: 'mockWarning',
      type: 'warning',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_warning')
    const chipText = getByText('mockWarning')
    expect(chip).toHaveStyle(`background-color: ${String(COLORS.transparent)}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${String(COLORS.yellow1)}`)
    const icon = getByLabelText('icon_mockWarning')
    expect(icon).toHaveStyle(`color: ${String(COLORS.yellow1)}`)
  })

  it('should render text, icon, bgcolor with neutral colors', () => {
    props = {
      text: 'mockNeutral',
      type: 'neutral',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_neutral')
    const chipText = getByText('mockNeutral')
    expect(chip).toHaveStyle(`background-color: ${COLORS.darkBlack20}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.darkBlack70}`)
    const icon = getByLabelText('icon_mockNeutral')
    expect(icon).toHaveStyle(`color: ${COLORS.darkBlack90}`)
  })

  it('should render text, icon, no bgcolor with neutral colors and bg false', () => {
    props = {
      background: false,
      text: 'mockNeutral',
      type: 'neutral',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_neutral')
    const chipText = getByText('mockNeutral')
    expect(chip).toHaveStyle(`background-color: ${COLORS.transparent}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.darkBlack70}`)
    const icon = getByLabelText('icon_mockNeutral')
    expect(icon).toHaveStyle(`color: ${COLORS.darkBlack90}`)
  })

  it('should render text, icon, bgcolor with error colors', () => {
    props = {
      text: 'mockError',
      type: 'error',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_error')
    const chipText = getByText('mockError')
    expect(chip).toHaveStyle(`background-color: ${COLORS.red3}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.red1}`)
    const icon = getByLabelText('icon_mockError')
    expect(icon).toHaveStyle(`color: ${COLORS.red1}`)
  })

  it('should render text, icon, no bgcolor with error colors and bg false', () => {
    props = {
      background: false,
      text: 'mockError',
      type: 'error',
    }
    const [{ getByTestId, getByText, getByLabelText }] = render(props)
    const chip = getByTestId('Chip_error')
    const chipText = getByText('mockError')
    expect(chip).toHaveStyle(`background-color: ${COLORS.transparent}`)
    expect(chip).toHaveStyle(`border-radius: ${BORDERS.borderRadiusSize5}`)
    expect(chipText).toHaveStyle(`color: ${COLORS.red1}`)
    const icon = getByLabelText('icon_mockError')
    expect(icon).toHaveStyle(`color: ${COLORS.red1}`)
  })
})
