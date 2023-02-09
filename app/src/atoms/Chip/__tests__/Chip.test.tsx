import * as React from 'react'

import { COLORS, renderWithProviders } from '@opentrons/components'

import { Chip } from '..'

const render = (props: React.ComponentProps<typeof Chip>) => {
  return renderWithProviders(<Chip {...props} />)
}

describe('Chip', () => {
  let props: React.ComponentProps<typeof Chip>

  it('should render text, icon with success colors', () => {
    props = {
      type: 'success',
      text: 'mockSuccess',
      iconName: 'ot-check',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockSuccess')
    expect(chip).toHaveStyle(`color: ${COLORS.successText}`)
    const icon = getByLabelText('icon_mockSuccess')
    expect(icon).toHaveStyle(`color: ${COLORS.successEnabled}`)
  })

  it('should render text, icon with error colors', () => {
    props = {
      type: 'error',
      text: 'mockError',
      iconName: 'ot-alert',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockError')
    expect(chip).toHaveStyle(`color: ${COLORS.errorText}`)
    const icon = getByLabelText('icon_mockError')
    expect(icon).toHaveStyle(`color: ${COLORS.errorEnabled}`)
  })

  it('should render text, icon with warning colors', () => {
    props = {
      type: 'warning',
      text: 'mockWarning',
      iconName: 'ot-alert',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockWarning')
    expect(chip).toHaveStyle(`color: ${COLORS.warningText}`)
    const icon = getByLabelText('icon_mockWarning')
    expect(icon).toHaveStyle(`color: ${COLORS.warningEnabled}`)
  })

  it('should render text, icon with informing colors', () => {
    props = {
      type: 'informing',
      text: 'mockInforming',
      iconName: 'ot-alert',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('mockInforming')
    expect(chip).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
    const icon = getByLabelText('icon_mockInforming')
    expect(icon).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
  })
})
