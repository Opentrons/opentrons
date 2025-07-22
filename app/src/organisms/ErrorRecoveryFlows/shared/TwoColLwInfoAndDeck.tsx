import { useTranslation } from 'react-i18next'

import {
  AlignLabwareToModule,
  COLORS,
  Flex,
  LabwareRender,
  Module,
  MoveLabwareOnDeck,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

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
    robotType,
    routeUpdateActions,
    failedPipetteUtils,
    failedLabwareUtils,
    deckMapUtils,
    currentRecoveryOptionUtils,
    isOnDevice,
    allRunDefs,
  } = props
  const {
    RETRY_NEW_TIPS,
    SKIP_STEP_WITH_NEW_TIPS,
    MANUAL_MOVE_AND_SKIP,
    MANUAL_REPLACE_AND_RETRY,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
  } = RECOVERY_MAP
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const {
    relevantPickUpTipWellName,
    relevantPickUpTipLabware,
  } = failedLabwareUtils
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions
  const { failedPipetteInfo, isPartialTipConfigValid } = failedPipetteUtils
  const { t } = useTranslation('error_recovery')

  const deckDef = getDeckDefFromRobotType(robotType)

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
            labwareDefinitions={allRunDefs}
            {...restUtils}
            backgroundItems={
              <>
                {moduleRenderInfo.map(
                  ({
                    x,
                    y,
                    moduleId,
                    slotName,
                    moduleDef,
                    nestedLabwareDef,
                    nestedLabwareId,
                    targetDeckId,
                    targetSlotId,
                  }) => (
                    <Module
                      key={moduleId}
                      def={moduleDef}
                      x={x}
                      y={y}
                      orientation={inferModuleOrientationFromXCoordinate(x)}
                      targetDeckId={targetDeckId}
                      targetSlotId={targetSlotId}
                      childrenPositioningMode="offsetToSlot"
                    >
                      {nestedLabwareDef != null &&
                      nestedLabwareId !== failedLwId ? (
                        <AlignLabwareToModule
                          deckId={deckDef.otId}
                          slotId={slotName}
                          moduleDefinition={moduleDef}
                          labwareDefinition={nestedLabwareDef}
                        >
                          <LabwareRender
                            definition={nestedLabwareDef}
                            positioningMode="passThrough"
                          />
                        </AlignLabwareToModule>
                      ) : null}
                    </Module>
                  )
                )}
                {labwareRenderInfo
                  .filter(l => l.labwareId !== failedLwId)
                  .map(({ labwareOrigin, labwareDef, labwareId }) => (
                    <g
                      key={labwareId}
                      transform={`translate(${labwareOrigin.x},${labwareOrigin.y})`}
                    >
                      <LabwareRender
                        definition={labwareDef}
                        positioningMode="passThrough"
                      />
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
          layout={'default'}
          bannerText={buildBannerText()}
        />
        <Flex marginTop="0.7rem">{buildDeckView()}</Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
