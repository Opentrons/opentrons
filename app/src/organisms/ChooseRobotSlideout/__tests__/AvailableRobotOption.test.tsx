import * as React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { AvailableRobotOption } from '../AvailableRobotOption'

const robotName = 'fakeRobotName'
const robotModel = 'OT-2'
describe('AvailableRobotOption', () => {
  it('renders slideout if showSlideout true', () => {
    const { queryByText } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
      />
    )
    expect(queryByText(robotModel)).toBeInTheDocument()
    expect(queryByText(robotName)).toBeInTheDocument()
  })
  it('renders usb icon if local', () => {
    const { queryByLabelText } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={true}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
      />
    )
    expect(queryByLabelText('usb')).toBeInTheDocument()
  })
  it('renders wifi icon if not local', () => {
    const { queryByLabelText } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
      />
    )
    expect(queryByLabelText('wifi')).toBeInTheDocument()
  })
  it('calls onClick prop when clicked', () => {
    const handleClick = jest.fn()

    const { container } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={false}
        onClick={handleClick()}
        isSelected={false}
        isError={false}
      />
    )
    fireEvent.click(container)
    expect(handleClick).toHaveBeenCalled()
  })
  it('renders error state when error present on selected robot', () => {
    const { getByLabelText } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={false}
        onClick={jest.fn()}
        isSelected={true}
        isError={true}
      />
    )
    expect(getByLabelText('icon_error')).toBeInTheDocument()
  })
})
