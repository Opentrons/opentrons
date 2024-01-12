import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders, LEGACY_COLORS } from '@opentrons/components'
import { ModalHeader } from '../ModalHeader'

const render = (props: React.ComponentProps<typeof ModalHeader>) => {
  return renderWithProviders(<ModalHeader {...props} />)[0]
}

describe('ModalHeader', () => {
  let props: React.ComponentProps<typeof ModalHeader>
  beforeEach(() => {
    props = {
      title: 'title',
    }
  })
  it('should render the title', () => {
    const { getByText } = render(props)
    getByText('title')
  })
  it('shoulder render the optional props', () => {
    props = {
      ...props,
      hasExitIcon: true,
      iconName: 'information',
      iconColor: COLORS.black90,
      onClick: jest.fn(),
    }
    render(props)
    expect(screen.getByLabelText('icon_information')).toHaveStyle(
      `color: ${COLORS.black90}`
    )
    fireEvent.click(screen.getByLabelText('closeIcon'))
    expect(props.onClick).toHaveBeenCalled()
  })
})
