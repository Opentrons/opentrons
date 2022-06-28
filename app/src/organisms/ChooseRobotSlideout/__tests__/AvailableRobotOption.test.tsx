import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { render, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { AvailableRobotOption } from '../AvailableRobotOption'
import { i18n } from '../../../i18n'

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
        isOnDifferentSoftwareVersion={false}
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
        isOnDifferentSoftwareVersion={false}
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
        isOnDifferentSoftwareVersion={false}
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
        isOnDifferentSoftwareVersion={false}
      />
    )
    fireEvent.click(container)
    expect(handleClick).toHaveBeenCalled()
  })
  it('renders link to device details if software version is out of sync with app and is selected', () => {
    const handleClick = jest.fn()

    const { getByText } = renderWithProviders(
      <StaticRouter>
        <AvailableRobotOption
          robotName={robotName}
          robotModel={robotModel}
          local={false}
          onClick={handleClick()}
          isSelected={true}
          isError={false}
          isOnDifferentSoftwareVersion={true}
        />
      </StaticRouter>,
      {
        i18nInstance: i18n,
      }
    )[0]
    expect(
      getByText(
        'A software update is available for this robot. Update to run protocols.'
      )
    ).toBeInTheDocument()
  })
  it('does not render link to device details if software version is out of sync with app and is not selected', () => {
    const handleClick = jest.fn()

    const { queryByText } = renderWithProviders(
      <StaticRouter>
        <AvailableRobotOption
          robotName={robotName}
          robotModel={robotModel}
          local={false}
          onClick={handleClick()}
          isSelected={false}
          isOnDifferentSoftwareVersion={true}
        />
      </StaticRouter>,
      {
        i18nInstance: i18n,
      }
    )[0]
    expect(
      queryByText(
        'A software update is available for this robot. Update to run protocols.'
      )
    ).toBeNull()
  })
})
