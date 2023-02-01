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
      text: 'Connected',
      textColor: COLORS.successText,
      iconName: 'ot-check',
      iconColor: COLORS.successEnabled,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('Connected')
    expect(chip).toHaveStyle(`color: ${COLORS.successText}`)
    const icon = getByLabelText('icon_Connected')
    expect(icon).toHaveStyle(`color: ${COLORS.successEnabled}`)
  })

  it('should render text, icon with warning colors', () => {
    props = {
      text: 'Missing 1 module',
      textColor: COLORS.warningText,
      iconName: 'ot-alert',
      iconColor: COLORS.warningBackgroundMed,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const chip = getByText('Missing 1 module')
    expect(chip).toHaveStyle(`color: ${COLORS.warningText}`)
    const icon = getByLabelText('icon_Missing 1 module')
    expect(icon).toHaveStyle(`color: ${COLORS.warningBackgroundMed}`)
  })
})
