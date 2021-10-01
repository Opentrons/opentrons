import * as React from 'react'
import {
  mountWithStore,
  WrapperWithStore,
} from '@opentrons/components'

import { ConfirmPipette } from '../ConfirmPipette'
import { CheckPipettesButton } from '../CheckPipettesButton'
import { TitleBar, Icon } from '@opentrons/components'

import type { Action, State } from '../../../redux/types'
import type { PipetteOffsetCalibration } from '../../../redux/calibration/types'
import type { Props } from '../ConfirmPipette'
import type {
  PipetteNameSpecs,
  PipetteModelSpecs,
} from '@opentrons/shared-data'

describe('ConfirmPipette', () => {
  const mockExit = jest.fn()
  const mockStartPipetteOffsetCalibration = jest.fn()
  const mockBack = jest.fn()
  const mockTryAgain = jest.fn()
  beforeEach(() => {
    jest.resetAllMocks()
  })
  const render = (
    props: Partial<Props>
  ): WrapperWithStore<
    React.ComponentProps<typeof ConfirmPipette>,
    State,
    Action
  > => {
    const {
      robotName = 'robot-name',
      mount = 'left',
      title = 'my-title',
      subtitle = 'my-subtitle',
      success = true,
      attachedWrong = false,
      wantedPipette = {
        displayName: 'wanted-display-name',
        channels: 1,
      } as PipetteNameSpecs,
      actualPipette = {} as PipetteModelSpecs,
      actualPipetteOffset = {} as PipetteOffsetCalibration,
      displayName = 'actual-display-name',
      displayCategory = 'GEN2',
    } = props
    return mountWithStore<
      React.ComponentProps<typeof ConfirmPipette>,
      State,
      Action
    >(
      <ConfirmPipette
        robotName={robotName}
        mount={mount}
        title={title}
        subtitle={subtitle}
        success={success}
        attachedWrong={attachedWrong}
        wantedPipette={wantedPipette}
        actualPipette={actualPipette}
        actualPipetteOffset={actualPipetteOffset}
        displayName={displayName}
        displayCategory={displayCategory}
        back={mockBack}
        exit={mockExit}
        tryAgain={mockTryAgain}
        startPipetteOffsetCalibration={mockStartPipetteOffsetCalibration}
      />,
      { initialState: { robotApi: {} } } as any
    )
  }

  const SPECS = [
    {
      success: true,
      attachedWrong: false,
      wantedPipette: {
        displayName: 'wanted',
        channels: 1,
      } as Partial<PipetteNameSpecs>,
      actualPipette: {} as Partial<PipetteModelSpecs>,
      actualPipetteOffset: null,
      backDisabled: true,
      iconName: 'check-circle',
      continueMatch: /pipette offset calibration/,
      continueOnClick: mockStartPipetteOffsetCalibration,
      exitMatch: /exit without calibrating/,
      bodyMatch: null,
      statusMatch: /successfully attached/,
      describe: 'pipette attached successfully with no calibration',
    },
    {
      success: true,
      attachedWrong: false,
      wantedPipette: {
        displayName: 'wanted',
        channels: 1,
      } as Partial<PipetteNameSpecs>,
      actualPipette: {} as Partial<PipetteModelSpecs>,
      actualPipetteOffset: {} as Partial<PipetteOffsetCalibration>,
      backDisabled: true,
      iconName: 'check-circle',
      continueMatch: null,
      continueOnClick: mockStartPipetteOffsetCalibration,
      exitMatch: /exit pipette setup/,
      bodyMatch: null,
      statusMatch: /successfully attached/,
      describe: 'pipette attached successfully with calibration',
    },
    {
      success: true,
      attachedWrong: false,
      wantedPipette: null,
      actualPipette: null,
      actualPipetteOffset: null,
      backDisabled: true,
      iconName: 'check-circle',
      continueMatch: /attach another pipette/i,
      continueOnClick: mockBack,
      exitMatch: /exit pipette setup/,
      bodyMatch: null,
      statusMatch: /pipette is detached/i,
      describe: 'pipette detached successfully',
    },
    {
      success: false,
      attachedWrong: false,
      wantedPipette: null,
      actualPipette: {} as Partial<PipetteModelSpecs>,
      actualPipetteOffset: {} as Partial<PipetteOffsetCalibration>,
      backDisabled: false,
      iconName: 'close-circle',
      continueMatch: /confirm pipette is detached/,
      continueOnClick: null,
      exitMatch: /exit pipette setup/,
      bodyMatch: /ensure that pipette is unplugged/,
      statusMatch: /pipette is not detached/i,
      describe: 'pipette not detached successfully',
    },
    {
      success: false,
      attachedWrong: true,
      wantedPipette: {
        displayName: 'my-display-name',
        channels: 1,
      } as Partial<PipetteNameSpecs>,
      actualPipette: {} as Partial<PipetteModelSpecs>,
      actualPipetteOffset: null,
      backDisabled: true,
      iconName: 'close-circle',
      continueMatch: /detach and try again/,
      continueOnClick: mockTryAgain,
      exitMatch: /keep pipette and exit setup/,
      bodyMatch: /the attached pipette does not match/i,
      statusMatch: /incorrect pipette attached/i,
      describe: 'wrong pipette attached (no calibration)',
    },
    {
      success: false,
      attachedWrong: true,
      wantedPipette: {
        displayName: 'my-display-name',
        channels: 1,
      } as Partial<PipetteNameSpecs>,
      actualPipette: {} as Partial<PipetteModelSpecs>,
      actualPipetteOffset: {} as Partial<PipetteOffsetCalibration>,
      backDisabled: true,
      iconName: 'close-circle',
      continueMatch: /detach and try again/,
      continueOnClick: mockTryAgain,
      exitMatch: /keep pipette and exit setup/,
      bodyMatch: /the attached pipette does not match/i,
      statusMatch: /incorrect pipette attached/i,
      describe: 'wrong pipette attached (calibration present)',
    },
  ]

  SPECS.forEach(spec => {
    describe(spec.describe, () => {
      const { wrapper } = render({
        success: spec.success,
        attachedWrong: spec.attachedWrong,
        wantedPipette: spec.wantedPipette as PipetteNameSpecs,
        actualPipette: spec.actualPipette as PipetteModelSpecs,
        actualPipetteOffset: spec.actualPipetteOffset as PipetteOffsetCalibration,
      })
      it('has the right title bar including back button disabled or not', () => {
        const titleBarProps = wrapper.find(TitleBar).props()
        expect(titleBarProps.title).toEqual('my-title')
        expect(titleBarProps.subtitle).toEqual('my-subtitle')
        expect(titleBarProps.back?.onClick).toBe(mockBack)
        expect(titleBarProps.back?.disabled).toEqual(spec.backDisabled)
      })
      it('displays the right exit button text', () => {
        const exitButton = wrapper.findWhere(
          elem => elem.is('button') && elem.prop('onClick') === mockExit
        )
        expect(exitButton.text()).toMatch(spec.exitMatch)
      })
      if (spec.continueMatch) {
        it('displays the right continue button text', () => {
          const continueButton = wrapper.findWhere(
            elem =>
              (elem.is('button') &&
                elem.prop('onClick') === spec.continueOnClick) ||
              elem.is(CheckPipettesButton)
          )

          expect(continueButton.length).toEqual(1)
          expect(continueButton.children().text()).toMatch(spec.continueMatch)
        })
      } else {
        it('does not have a continue button', () => {
          const mainBody = wrapper.find('.modal_page_contents')
          expect(mainBody.find('button').length).toEqual(1)
        })
      }
      it('displays the right warning body if any', () => {
        const body = wrapper.find('.confirm_failure_instructions')
        spec.bodyMatch
          ? expect(body.text()).toMatch(spec.bodyMatch)
          : expect(body.length).toEqual(0)
      })
      it('displays the right status body', () => {
        const body = wrapper.find('.confirm_status')
        const icon = body.find(Icon)
        expect(icon.prop('name')).toEqual(spec.iconName)
        expect(body.text()).toMatch(spec.statusMatch)
      })
    })
  })
})
