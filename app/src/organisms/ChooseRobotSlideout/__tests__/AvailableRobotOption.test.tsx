import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { render, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { AvailableRobotOption } from '../AvailableRobotOption'
import { i18n } from '../../../i18n'

const robotName = 'fakeRobotName'
const robotModel = 'OT-2'
const OT2_PNG_FILE_NAME = 'OT2-R_HERO.png'
const OT3_PNG_FILE_NAME = 'OT3.png'
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
  it('renders OT-2 image when the robot model is OT-2', () => {
    const { getByRole } = render(
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
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT2_PNG_FILE_NAME)
  })
  it('renders OT-3 image when the robot model is OT-3', () => {
    const { getByRole } = render(
      <AvailableRobotOption
        robotName={robotName}
        robotModel="OT-3"
        local={false}
        onClick={jest.fn()}
        isSelected={false}
        isError={false}
        isOnDifferentSoftwareVersion={false}
      />
    )
    const image = getByRole('img')
    expect(image.getAttribute('src')).toEqual(OT3_PNG_FILE_NAME)
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
