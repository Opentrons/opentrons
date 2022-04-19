import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'

import type { Mount } from '../../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof PipetteOverflowMenu>) => {
  return renderWithProviders(<PipetteOverflowMenu {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockRobotName = 'mockRobotName'
const LEFT = 'left' as Mount
describe('PipetteOverflowMenu', () => {
  let props: React.ComponentProps<typeof PipetteOverflowMenu>

  beforeEach(() => {
    props = {
      pipetteName: mockLeftProtoPipette.displayName,
      mount: LEFT,
      robotName: mockRobotName,
      handleChangePipette: jest.fn(),
      handleSlideout: jest.fn(),
    }
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders information with a pipette attached', () => {
    const { getByRole } = render(props)
    const calibrate = getByRole('button', { name: 'Calibrate pipette offset' })
    const detach = getByRole('button', { name: 'Detach pipette' })
    const settings = getByRole('button', { name: 'View pipette settings' })
    const about = getByRole('button', { name: 'About pipette' })
    fireEvent.click(detach)
    expect(props.handleChangePipette).toHaveBeenCalled()
    fireEvent.click(settings)
    expect(props.handleSlideout).toHaveBeenCalled()
    fireEvent.click(about)
    expect(props.handleSlideout).toHaveBeenCalled()
    fireEvent.click(calibrate)
    //  TODO((jr, 4/19/22):wire this up when calibrate button is complete
  })
  it('renders information with no pipette attached', () => {
    props = {
      pipetteName: 'Empty',
      mount: LEFT,
      robotName: mockRobotName,
      handleChangePipette: jest.fn(),
      handleSlideout: jest.fn(),
    }
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Attach pipette' })
    fireEvent.click(btn)
    expect(props.handleChangePipette).toHaveBeenCalled()
  })
})
