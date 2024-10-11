import { useState, useLayoutEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  Flex,
  SPACING,
  StyledText,
  RadioButton,
  OVERFLOW_AUTO,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import { BLOWOUT_SUCCESS, DROP_TIP_SUCCESS, DT_ROUTES } from '../constants'
import { DropTipFooterButtons } from '../shared'

import type { AddressableAreaName } from '@opentrons/shared-data'
import type {
  DropTipWizardContainerProps,
  ValidDropTipBlowoutLocation,
} from '../types'
import type {
  DropTipBlowoutLocationDetails,
  DropTipBlowoutSlotName,
} from '../hooks'
import type { UseConfirmPositionResult } from './ConfirmPosition'

interface ChooseLocationProps extends DropTipWizardContainerProps {
  toggleIsRobotPipetteMoving: UseConfirmPositionResult['toggleIsRobotPipetteMoving']
}

export function ChooseLocation({
  dropTipCommandLocations,
  dropTipCommands,
  goBackRunValid,
  currentRoute,
  proceed,
  proceedToRouteAndStep,
  toggleIsRobotPipetteMoving,
  modalStyle,
}: ChooseLocationProps): JSX.Element {
  const { t } = useTranslation('drop_tip_wizard')
  const { moveToAddressableArea, blowoutOrDropTip } = dropTipCommands

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<DropTipBlowoutLocationDetails | null>(null)

  // On initial render with values, synchronously set the first option as the selected option.
  useLayoutEffect(() => {
    if (dropTipCommandLocations.length > 0) {
      setSelectedLocation(dropTipCommandLocations[0])
    }
  }, [dropTipCommandLocations.length])

  const buildTitleCopy = (): string => {
    if (currentRoute === DT_ROUTES.BLOWOUT) {
      return t('where_to_blowout')
    } else if (currentRoute === DT_ROUTES.DROP_TIP) {
      return t('where_to_drop_tips')
    } else {
      console.error('Unhandled choose location copy from step')
      return t('where_to_drop_tips')
    }
  }

  const buildLocationCopy = (
    locationValue: ValidDropTipBlowoutLocation,
    slotName: DropTipBlowoutSlotName
  ): string => {
    switch (locationValue) {
      case 'trash-bin':
        return t('trash_bin_in_slot', { slot: slotName })
      case 'waste-chute':
        return t('waste_chute_in_slot', { slot: slotName })
      case 'fixed-trash':
        return t('fixed_trash_in_12')
      case 'deck':
        return t('choose_deck_location')
      default:
        console.error('Unexpected location value.')
        return ''
    }
  }

  const handleChange = useCallback(
    (locationDetails: DropTipBlowoutLocationDetails) => {
      setSelectedLocation(locationDetails)
    },
    []
  )

  const executeCommands = (): void => {
    toggleIsRobotPipetteMoving()
    void moveToAddressableArea(
      selectedLocation?.slotName as AddressableAreaName,
      false
    ).then(() => {
      void blowoutOrDropTip(currentRoute, () => {
        const successStep =
          currentRoute === DT_ROUTES.BLOWOUT
            ? BLOWOUT_SUCCESS
            : DROP_TIP_SUCCESS
        void proceedToRouteAndStep(currentRoute, successStep)
      })
    })
  }

  const primaryOnClick = (): void => {
    switch (selectedLocation?.location) {
      case 'deck':
        void proceed()
        break
      case 'labware':
      case 'trash-bin':
      case 'waste-chute':
      case 'fixed-trash':
        executeCommands()
        break
      default:
        console.error(
          `Unhandled onClick behavior for location: ${selectedLocation?.location}`
        )
    }
  }

  return (
    <Flex
      css={
        modalStyle === 'simple'
          ? CONTAINER_STYLE_SIMPLE
          : CONTAINER_STYLE_INTERVENTION
      }
    >
      <Flex css={OPTION_CONTAINER_STYLE}>
        <StyledText
          oddStyle="level4HeaderSemiBold"
          desktopStyle="headingSmallBold"
        >
          {buildTitleCopy()}
        </StyledText>
        <Flex css={BUTTON_CONTAINER_STYLE}>
          {dropTipCommandLocations.map(ld => {
            const label = buildLocationCopy(ld.location, ld.slotName)
            return (
              <RadioButton
                key={label}
                buttonLabel={label}
                buttonValue={ld.slotName}
                onChange={() => {
                  handleChange(ld)
                }}
                isSelected={ld.slotName === selectedLocation?.slotName}
                largeDesktopBorderRadius={true}
              />
            )
          })}
        </Flex>
      </Flex>
      <DropTipFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackRunValid}
      />
    </Flex>
  )
}

const CONTAINER_STYLE_BASE = `
  overflow: ${OVERFLOW_AUTO};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  height: 100%;
  width: 100%;
  flex-grow: 1;
`

const CONTAINER_STYLE_INTERVENTION = css`
  ${CONTAINER_STYLE_BASE}
`

const CONTAINER_STYLE_SIMPLE = css`
  ${CONTAINER_STYLE_BASE}
  justify-content: ${JUSTIFY_SPACE_BETWEEN};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: 80%;
    flex-grow: 0;
  }
`

const OPTION_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
`

const BUTTON_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing4};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing8};
  }
`
