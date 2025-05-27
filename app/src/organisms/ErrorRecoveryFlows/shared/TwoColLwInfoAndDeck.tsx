import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Flex,
  LabwareRender,
  Module,
  MoveLabwareOnDeck,
} from '@opentrons/components'
import { inferModuleOrientationFromXCoordinate } from '@opentrons/shared-data'

import { DeckMapContent, TwoColumn } from '/app/molecules/InterventionModal'

import { RECOVERY_MAP } from '../constants'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { ComponentProps } from 'react'
import type { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'
import type { RecoveryContentProps } from '../types'

export function TwoColLwInfoAndDeck(
  props: RecoveryContentProps
): JSX.Element | null {
  const {
    routeUpdateActions,
    failedPipetteUtils,
    failedLabwareUtils,
    deckMapUtils,
    currentRecoveryOptionUtils,
    isOnDevice,
    recoveryMap,
    recoveryCommands,
  } = props
  const {
    RETRY_NEW_TIPS,
    SKIP_STEP_WITH_NEW_TIPS,
    MANUAL_MOVE_AND_SKIP,
    MANUAL_REPLACE_AND_RETRY,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
    STACKER_STALLED_RETRY,
    STACKER_STALLED_SKIP,
    STACKER_SHUTTLE_MISSING_RETRY,
    STACKER_HOPPER_EMPTY_RETRY,
    STACKER_HOPPER_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP
  const { manualRetrieve } = recoveryCommands
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const {
    relevantPickUpTipWellName,
    relevantPickUpTipLabware,
    labwareQuantity,
  } = failedLabwareUtils
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions
  const { route, step } = recoveryMap
  const { failedPipetteInfo, isPartialTipConfigValid } = failedPipetteUtils
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    switch (route) {
      case STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      case STACKER_STALLED_SKIP.ROUTE:
        switch (step) {
          case STACKER_HOPPER_EMPTY_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
          case STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE:
            void manualRetrieve().then(() => proceedNextStep())
        }
    }
    void proceedNextStep()
  }

  const {
    displayNameCurrentLoc: slot,
  } = failedLabwareUtils.relevantPickUpTipLwLocs

  const buildTitle = (): string => {
    switch (selectedRecoveryOption) {
      case MANUAL_MOVE_AND_SKIP.ROUTE:
        return t('manually_move_lw_on_deck')
      case MANUAL_REPLACE_AND_RETRY.ROUTE:
        return t('manually_replace_lw_on_deck')
      case HOME_AND_RETRY.ROUTE:
      case RETRY_NEW_TIPS.ROUTE:
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE:
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE: {
        // Only special case the "full" 96-channel nozzle config.
        if (
          failedPipetteInfo?.data.channels === 96 &&
          !isPartialTipConfigValid
        ) {
          return t('replace_with_new_tip_rack', { slot })
        } else {
          return t('replace_used_tips_in_rack_location', {
            location: relevantPickUpTipWellName,
            slot,
          })
        }
      }
      case STACKER_STALLED_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
        return t('ensure_stacker_has_labware')
      case STACKER_STALLED_SKIP.ROUTE:
      case STACKER_HOPPER_EMPTY_SKIP.ROUTE:
        if (
          step === STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE ||
          step ===
          STACKER_HOPPER_EMPTY_SKIP.STEPS
            .HOPPER_MANUAL_REPLACE ||
          step === STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_RETRY
        ) {
          return t('load_labware_into_labware_shuttle')
        } else {
          return t('ensure_stacker_has_labware')
        }
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
        return t('ensure_stacker_has_labware')
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
        return t('load_labware_into_stacker', { quantity: labwareQuantity })
      default:
        console.error(
          `TwoColLwInfoAndDeck: Unexpected recovery option: ${selectedRecoveryOption}. Handle retry step copy explicitly.`
        )
        return 'UNEXPECTED RECOVERY OPTION'
    }
  }

  const buildBannerText = (): string | null => {
    switch (selectedRecoveryOption) {
      case MANUAL_MOVE_AND_SKIP.ROUTE:
      case MANUAL_REPLACE_AND_RETRY.ROUTE:
        return t('ensure_lw_is_accurately_placed')
      case RETRY_NEW_TIPS.ROUTE:
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE:
      case HOME_AND_RETRY.ROUTE:
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE: {
        return isPartialTipConfigValid
          ? t('replace_tips_and_select_loc_partial_tip')
          : t('replace_tips_and_select_location')
      }
      case STACKER_STALLED_RETRY.ROUTE:
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
        return t('make_sure_loaded_correct_number_of_labware_stacker')
      case STACKER_STALLED_SKIP.ROUTE:
      case STACKER_HOPPER_EMPTY_SKIP.ROUTE:
        if (
          step === STACKER_STALLED_SKIP.STEPS.MANUAL_REPLACE ||
          step ===
          STACKER_HOPPER_EMPTY_SKIP.STEPS.HOPPER_MANUAL_REPLACE
        ) {
          return null
        } else {
          return t('make_sure_loaded_correct_number_of_labware_stacker')
        }
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
        return t('make_sure_loaded_correct_number_of_labware_stacker')
      default:
        console.error(
          `TwoColLwInfoAndDeck:buildBannerText: Unexpected recovery option ${selectedRecoveryOption}. Handle retry step copy explicitly.`
        )
        return 'UNEXPECTED RECOVERY OPTION'
    }
  }

  const buildType = (): ComponentProps<
    typeof InterventionContent
  >['infoProps']['type'] => {
    switch (selectedRecoveryOption) {
      case MANUAL_MOVE_AND_SKIP.ROUTE:
        return 'location-arrow-location'
      default:
        return 'location'
    }
  }

  const buildLayoutType = (): ComponentProps<
    typeof InterventionContent
  >['infoProps']['layout'] => {
    switch (selectedRecoveryOption) {
      case STACKER_STALLED_SKIP.ROUTE:
      case STACKER_STALLED_RETRY.ROUTE:
      case STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      case STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return 'stacked'
      default:
        return 'default'
    }
  }

  // TODO(jh, 10-22-24): Componentize an app-only abstraction above MoveLabwareOnDeck. EXEC-788.
  const buildDeckView = (): JSX.Element => {
    switch (selectedRecoveryOption) {
      case MANUAL_MOVE_AND_SKIP.ROUTE: {
        const { newLoc, currentLoc } = failedLabwareUtils.failedLabwareLocations
        const {
          movedLabwareDef,
          moduleRenderInfo,
          labwareRenderInfo,
          ...restUtils
        } = deckMapUtils

        const failedLwId = relevantPickUpTipLabware?.id ?? ''

        const isValidDeck =
          currentLoc != null && newLoc != null && movedLabwareDef != null

        return isValidDeck ? (
          <MoveLabwareOnDeck
            deckFill={isOnDevice ? COLORS.grey35 : '#e6e6e6'}
            initialLabwareLocation={currentLoc}
            finalLabwareLocation={newLoc}
            movedLabwareDef={movedLabwareDef}
            {...restUtils}
            backgroundItems={
              <>
                {moduleRenderInfo.map(
                  ({
                    x,
                    y,
                    moduleId,
                    moduleDef,
                    nestedLabwareDef,
                    nestedLabwareId,
                  }) => (
                    <Module
                      key={moduleId}
                      def={moduleDef}
                      x={x}
                      y={y}
                      orientation={inferModuleOrientationFromXCoordinate(x)}
                    >
                      {nestedLabwareDef != null &&
                        nestedLabwareId !== failedLwId ? (
                        <LabwareRender definition={nestedLabwareDef} />
                      ) : null}
                    </Module>
                  )
                )}
                {labwareRenderInfo
                  .filter(l => l.labwareId !== failedLwId)
                  .map(({ x, y, labwareDef, labwareId }) => (
                    <g key={labwareId} transform={`translate(${x},${y})`}>
                      {labwareDef != null && labwareId !== failedLwId ? (
                        <LabwareRender definition={labwareDef} />
                      ) : null}
                    </g>
                  ))}
              </>
            }
          />
        ) : (
          <Flex />
        )
      }
      default:
        return <DeckMapContent {...deckMapUtils} />
    }
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={buildTitle()}
          type={buildType()}
          layout={buildLayoutType()}
          bannerText={buildBannerText()}
        />
        <Flex marginTop="0.7rem">{buildDeckView()}</Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
