import * as React from 'react'
import { COLORS, renderWithProviders } from '@opentrons/components'
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
      text: 'text',
    }
  })
  it('renders the equipment option without checkbox or image', () => {
    const { getByText } = render(props)
    getByText('text')
  })
  it('renders the equipment option without check not selected and image', () => {
    props = {
      ...props,
      showCheckbox: true,
      image: <img src="img" />,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('text')
    getByRole('img', { name: '' })
    expect(
      getByLabelText('EquipmentOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.darkGreyEnabled}`)
  })
  it('renders the equipment option without check selected', () => {
    props = {
      ...props,
      isSelected: true,
      showCheckbox: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('text')
    expect(getByLabelText('EquipmentOption_checkbox-marked')).toHaveStyle(
      `color: ${COLORS.blueEnabled}`
    )
  })
})
