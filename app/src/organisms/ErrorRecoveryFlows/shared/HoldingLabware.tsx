import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RecoveryRadioGroup } from '/app/organisms/ErrorRecoveryFlows/shared/RecoveryRadioGroup'

import { DESKTOP_ONLY, ODD_ONLY, RECOVERY_MAP } from '../constants'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { TFunction } from 'i18next'
import type { JSX } from 'react'
import type { RecoveryContentProps } from '../types'

type HoldingLabwareOption = 'yes' | 'no'
export const HOLDING_LABWARE_OPTIONS: HoldingLabwareOption[] = [
  'yes',
  'no',
] as const

export function HoldingLabware({
  routeUpdateActions,
  currentRecoveryOptionUtils,
  recoveryCommands,
  recoveryMap,
}: RecoveryContentProps): JSX.Element {
  const {
    proceedNextStep,
    proceedToRouteAndStep,
    goBackPrevStep,
    handleMotionRouting,
  } = routeUpdateActions
  const { route } = recoveryMap
  const { homeExceptPlungers } = recoveryCommands
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const {
    MANUAL_MOVE_AND_SKIP,
    MANUAL_REPLACE_AND_RETRY,
    OPTION_SELECTION,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP

  const [selectedOption, setSelectionOption] = useState<HoldingLabwareOption>(
    HOLDING_LABWARE_OPTIONS[0]
  )
  const { t } = useTranslation(['error_recovery', 'shared'])

  const buildTitle = (): string => {
    switch (route) {
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return t('is_there_labware_stuck_on_the_stacker_latch')
      default:
        return t('first_is_gripper_holding_labware')
    }
  }
  const handleNoOption = (): void => {
    // The "yes" option also contains a home, but it occurs later in the control flow,
    // after the user has extricated the labware from the gripper jaws.
    void handleMotionRouting(true)
      .then(() => homeExceptPlungers())
      .finally(() => handleMotionRouting(false))
      .then(() => {
        switch (selectedRecoveryOption) {
          case MANUAL_MOVE_AND_SKIP.ROUTE:
            return proceedToRouteAndStep(
              MANUAL_MOVE_AND_SKIP.ROUTE,
              MANUAL_MOVE_AND_SKIP.STEPS.MANUAL_MOVE
            )
          case MANUAL_REPLACE_AND_RETRY.ROUTE:
            return proceedToRouteAndStep(
              MANUAL_REPLACE_AND_RETRY.ROUTE,
              MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE
            )
          case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
            return proceedToRouteAndStep(
              STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
              STACKER_SHUTTLE_EMPTY_RETRY.STEPS.FILL_HOPPER
            )
          case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
            return proceedToRouteAndStep(
              STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
              STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE
            )
          default: {
            console.error('Unexpected recovery option for gripper routing.')
            return proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
          }
        }
      })
  }

  const primaryOnClick = (): void => {
    switch (selectedOption) {
      case 'yes':
        void proceedNextStep()
        break
      case 'no':
        handleNoOption()
        break
      default: {
        console.error('Unhandled primary onClick given gripper option')
      }
    }
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <Flex css={CONTAINER_STYLE}>
        <StyledText
          oddStyle="level4HeaderSemiBold"
          desktopStyle="headingSmallBold"
        >
          {buildTitle()}
        </StyledText>
        <Flex css={ODD_ONLY}>
          <ODDGripperHoldingLwOptions
            selectedOption={selectedOption}
            setSelectedOption={setSelectionOption}
            t={t}
          />
        </Flex>
        <Flex css={DESKTOP_ONLY}>
          <DesktopGripperHoldingLwOptions
            selectedOption={selectedOption}
            setSelectedOption={setSelectionOption}
            t={t}
          />
        </Flex>
      </Flex>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

interface GripperHoldingOptionsProps {
  t: TFunction
  selectedOption: HoldingLabwareOption
  setSelectedOption: (option: HoldingLabwareOption) => void
}

function ODDGripperHoldingLwOptions({
  t,
  selectedOption,
  setSelectedOption,
}: GripperHoldingOptionsProps): JSX.Element {
  return (
    <Flex css={ODD_OPTIONS_STLYE}>
      {HOLDING_LABWARE_OPTIONS.map(option => {
        const optionCopy = getCopyFromOption(option, t)
        return (
          <RadioButton
            key={`gripper_option_${option}`}
            buttonLabel={optionCopy}
            buttonValue={optionCopy}
            onChange={() => {
              setSelectedOption(option)
            }}
            isSelected={option === selectedOption}
            radioButtonType="large"
          />
        )
      })}
    </Flex>
  )
}

function DesktopGripperHoldingLwOptions({
  t,
  selectedOption,
  setSelectedOption,
}: GripperHoldingOptionsProps): JSX.Element {
  return (
    <RecoveryRadioGroup
      css={RADIO_GAP}
      onChange={e => {
        setSelectedOption(e.currentTarget.value as HoldingLabwareOption)
      }}
      value={selectedOption}
      options={HOLDING_LABWARE_OPTIONS.map(
        option =>
          ({
            value: option,
            children: (
              <Flex role="label" htmlFor={option}>
                <StyledText desktopStyle="bodyDefaultRegular">
                  {getCopyFromOption(option, t)}
                </StyledText>
              </Flex>
            ),
          } as const)
      )}
    />
  )
}

export function getCopyFromOption(
  option: HoldingLabwareOption,
  t: TFunction
): string {
  switch (option) {
    case 'yes':
      return i18n.format(t('shared:yes'), 'capitalize')
    case 'no':
      return i18n.format(t('shared:no'), 'capitalize')
    default:
      console.error('Unhandled copy option.')
      return 'UNHANDLED OPTION'
  }
}

const CONTAINER_STYLE = css`
  grid-gap: ${SPACING.spacing16};
  flex-direction: ${DIRECTION_COLUMN};
`

const ODD_OPTIONS_STLYE = css`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  gap: ${SPACING.spacing8};
`

const RADIO_GAP = `
  gap: ${SPACING.spacing4};
`
