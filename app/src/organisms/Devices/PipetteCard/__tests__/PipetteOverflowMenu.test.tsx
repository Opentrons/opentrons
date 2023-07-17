import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { PipetteOverflowMenu } from '../PipetteOverflowMenu'
import { mockLeftProtoPipette } from '../../../../redux/pipettes/__fixtures__'
import { isOT3Pipette } from '@opentrons/shared-data'

import type { Mount } from '../../../../redux/pipettes/types'

jest.mock('../../../../redux/config')
jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    isOT3Pipette: jest.fn(),
  }
})

const mockIsOT3Pipette = isOT3Pipette as jest.MockedFunction<
  typeof isOT3Pipette
>

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
      pipetteSpecs: mockLeftProtoPipette.modelSpecs,
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
    const detach = getByRole('button', { name: 'Detach pipette' })
    const settings = getByRole('button', { name: 'Pipette Settings' })
    const about = getByRole('button', { name: 'About pipette' })
    fireEvent.click(detach)
    expect(props.handleChangePipette).toHaveBeenCalled()
    fireEvent.click(settings)
    expect(props.handleSettingsSlideout).toHaveBeenCalled()
    fireEvent.click(about)
    expect(props.handleAboutSlideout).toHaveBeenCalled()
  })
  it('renders information with no pipette attached', () => {
    props = {
      pipetteSpecs: null,
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

  it('renders recalibrate pipette text for OT-3 pipette', () => {
    mockIsOT3Pipette.mockReturnValue(true)

    props = {
      pipetteSpecs: mockLeftProtoPipette.modelSpecs,
      mount: LEFT,
      handleChangePipette: jest.fn(),
      handleCalibrate: jest.fn(),
      handleAboutSlideout: jest.fn(),
      handleSettingsSlideout: jest.fn(),
      isPipetteCalibrated: true,
    }
    const { getByRole } = render(props)
    const recalibrate = getByRole('button', {
      name: 'Recalibrate pipette',
    })
    fireEvent.click(recalibrate)
    expect(props.handleCalibrate).toHaveBeenCalled()
  })

  it('should render recalibrate pipette text for OT-3 pipette', () => {
    mockIsOT3Pipette.mockReturnValue(true)
    props = {
      ...props,
      isPipetteCalibrated: true,
    }
    const { queryByRole } = render(props)
    expect(
      queryByRole('button', {
        name: 'Recalibrate pipette',
      })
    ).toBeInTheDocument()
  })

  it('renders only the about pipette button if FLEX pipette is attached', () => {
    mockIsOT3Pipette.mockReturnValue(true)

    const { getByRole, queryByRole } = render(props)

    const calibrate = getByRole('button', {
      name: 'Calibrate pipette',
    })
    const detach = getByRole('button', { name: 'Detach pipette' })
    const settings = queryByRole('button', { name: 'Pipette Settings' })
    const about = getByRole('button', { name: 'About pipette' })

    fireEvent.click(calibrate)
    expect(props.handleCalibrate).toHaveBeenCalled()
    fireEvent.click(detach)
    expect(props.handleChangePipette).toHaveBeenCalled()
    expect(settings).toBeNull()
    fireEvent.click(about)
    expect(props.handleAboutSlideout).toHaveBeenCalled()
  })
})
