import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { AboutGripperSlideout } from '../AboutGripperSlideout'

const render = (props: React.ComponentProps<typeof AboutGripperSlideout>) => {
  return renderWithProviders(<AboutGripperSlideout {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AboutGripperSlideout', () => {
  let props: React.ComponentProps<typeof AboutGripperSlideout>
  beforeEach(() => {
    props = {
      serialNumber: '123',
      isExpanded: true,
      onCloseClick: jest.fn(),
    }
  })

  it('renders correct info', () => {
    const { getByText, getByRole } = render(props)

    getByText('About Flex Gripper')
    getByText('123')
    getByText('SERIAL NUMBER')
    const button = getByRole('button', { name: /exit/i })
    fireEvent.click(button)
    expect(props.onCloseClick).toHaveBeenCalled()
  })
  it('renders the firmware version if it exists', () => {
    props = { ...props, firmwareVersion: '12' }
    const { getByText } = render(props)

    getByText('Current Version')
    getByText('12')
  })
})
