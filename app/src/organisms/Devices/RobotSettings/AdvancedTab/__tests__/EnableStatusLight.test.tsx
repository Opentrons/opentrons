import * as React from 'react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { useLEDLights } from '../../../hooks'
import { EnableStatusLight } from '../EnableStatusLight'

jest.mock('../../../hooks')

const mockUseLEDLights = useLEDLights as jest.MockedFunction<
  typeof useLEDLights
>

const ROBOT_NAME = 'otie'
const mockToggleLights = jest.fn()
const render = (props: React.ComponentProps<typeof EnableStatusLight>) => {
  return renderWithProviders(<EnableStatusLight {...props} />, {
    i18nInstance: i18n,
  })
}

describe('EnableStatusLight', () => {
  let props: React.ComponentProps<typeof EnableStatusLight>

  beforeEach(() => {
    props = {
      robotName: ROBOT_NAME,
      isEstopNotDisengaged: false,
    }
    mockUseLEDLights.mockReturnValue({
      lightsEnabled: false,
      toggleLights: mockToggleLights,
    })
  })

  it('should render text and toggle button', () => {
    const [{ getByText, getByLabelText }] = render(props)
    getByText('Enable status light')
    getByText(
      'Turn on or off the strip of color LEDs on the front of the robot.'
    )
    expect(getByLabelText('enable_status_light')).toBeInTheDocument()
  })

  it('should call a mock function when clicking toggle button', () => {
    const [{ getByLabelText }] = render(props)
    getByLabelText('enable_status_light').click()
    expect(mockToggleLights).toHaveBeenCalled()
  })

  it('shoud make toggle button disabled when e-stop is pressed', () => {
    props = {
      ...props,
      isEstopNotDisengaged: true,
    }
    const [{ getByLabelText }] = render(props)
    expect(getByLabelText('enable_status_light')).toBeDisabled()
  })
})
