import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'
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
      iconColor: COLORS.black,
      onClick: jest.fn(),
    }
    const { getByLabelText } = render(props)
    expect(getByLabelText('icon_information')).toHaveStyle(
      `color: ${COLORS.black}`
    )
    getByLabelText('closeIcon').click()
    expect(props.onClick).toHaveBeenCalled()
  })
  it('should render the header with red when isError is true', () => {
    props = {
      ...props,
      isError: true,
      iconName: 'information',
      iconColor: COLORS.black,
    }
    const { getByLabelText } = render(props)
    expect(getByLabelText('icon_information')).toHaveStyle(
      `color: ${COLORS.white}`
    )
  })
})
