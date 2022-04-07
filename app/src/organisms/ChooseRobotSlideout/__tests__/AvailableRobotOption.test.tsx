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
      />
    )
    expect(queryByLabelText('wifi')).toBeInTheDocument()
  })
  it('calls onClick prop when clickecd', () => {
    const handleClick = jest.fn()

    const { container } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel={robotModel}
        local={false}
        onClick={handleClick()}
        isSelected={false}
      />
    )
    fireEvent.click(container)
    expect(handleClick).toHaveBeenCalled()
  })
})
