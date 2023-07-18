import * as React from 'react'
import { BORDERS, COLORS, renderWithProviders } from '@opentrons/components'
import { EquipmentOption } from '../EquipmentOption'

const render = (props: React.ComponentProps<typeof EquipmentOption>) => {
  return renderWithProviders(<EquipmentOption {...props} />)[0]
}

describe('EquipmentOption', () => {
  let props: React.ComponentProps<typeof EquipmentOption>

  beforeEach(() => {
    props = {
      onClick: jest.fn(),
      isSelected: false,
      text: 'mockText',
    }
  })
  it('renders the equipment option without checkbox or image', () => {
    const { getByText } = render(props)
    getByText('mockText')
  })
  it('renders the equipment option without check not selected and image', () => {
    props = {
      ...props,
      showCheckbox: true,
      image: <img src="img" />,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('mockText')
    getByRole('img')
    expect(
      getByLabelText('EquipmentOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
    expect(getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: ${BORDERS.lineBorder}`
    )
  })
  it('renders the equipment option without check selected', () => {
    props = {
      ...props,
      isSelected: true,
      showCheckbox: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('mockText')
    expect(getByLabelText('EquipmentOption_checkbox-marked')).toHaveStyle(
      `color: ${COLORS.blueEnabled}`
    )
    expect(getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: ${BORDERS.activeLineBorder}`
    )
  })
})
