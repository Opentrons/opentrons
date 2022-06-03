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

const LEFT = 'left' as Mount
describe('PipetteOverflowMenu', () => {
  let props: React.ComponentProps<typeof PipetteOverflowMenu>

  beforeEach(() => {
    props = {
      pipetteName: mockLeftProtoPipette.displayName,
      mount: LEFT,
      handleChangePipette: jest.fn(),
      handleCalibrate: jest.fn(),
      handleAboutSlideout: jest.fn(),
      handleSettingsSlideout: jest.fn(),
      isPipetteCalibrated: false,
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
    const settings = getByRole('button', { name: 'Pipette Settings' })
    const about = getByRole('button', { name: 'About pipette' })
    fireEvent.click(detach)
    expect(props.handleChangePipette).toHaveBeenCalled()
    fireEvent.click(settings)
    expect(props.handleSettingsSlideout).toHaveBeenCalled()
    fireEvent.click(about)
    expect(props.handleAboutSlideout).toHaveBeenCalled()
    fireEvent.click(calibrate)
    expect(props.handleCalibrate).toHaveBeenCalled()
  })
  it('renders information with no pipette attached', () => {
    props = {
      pipetteName: 'Empty',
      mount: LEFT,
      handleChangePipette: jest.fn(),
      handleCalibrate: jest.fn(),
      handleAboutSlideout: jest.fn(),
      handleSettingsSlideout: jest.fn(),
      isPipetteCalibrated: false,
    }
    const { getByRole } = render(props)
    const btn = getByRole('button', { name: 'Attach pipette' })
    fireEvent.click(btn)
    expect(props.handleChangePipette).toHaveBeenCalled()
  })
  it('renders recalibrate pipette offset text', () => {
    props = {
      pipetteName: mockLeftProtoPipette.displayName,
      mount: LEFT,
      handleChangePipette: jest.fn(),
      handleCalibrate: jest.fn(),
      handleAboutSlideout: jest.fn(),
      handleSettingsSlideout: jest.fn(),
      isPipetteCalibrated: true,
    }
    const { getByRole } = render(props)
    const recalibrate = getByRole('button', {
      name: 'Recalibrate pipette offset',
    })
    fireEvent.click(recalibrate)
    expect(props.handleCalibrate).toHaveBeenCalled()
  })
})
