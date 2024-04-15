import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  getModuleDisplayName,
  CutoutConfig,
  DeckConfiguration,
  THERMOCYCLER_MODULE_TYPE,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  CutoutFixtureId,
  CutoutId,
  getCutoutIdsFromModuleSlotName,
  getCutoutFixtureIdsForModuleModel,
  getCutoutFixturesForModuleModel,
  ModuleLocation,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import {
  DeckLocationSelect,
  RESPONSIVENESS,
  SIZE_1,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Banner } from '../../atoms/Banner'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import type { ModuleCalibrationWizardStepProps } from './types'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
interface SelectLocationProps extends ModuleCalibrationWizardStepProps {
  availableSlotNames: string[]
  occupiedCutouts: CutoutConfig[]
  deckConfig: DeckConfiguration
  fixtureIdByCutoutId: { [cutoutId in CutoutId]?: CutoutFixtureId }
}
export const SelectLocation = (
  props: SelectLocationProps
): JSX.Element | null => {
  const {
    proceed,
    attachedModule,
    deckConfig,
    availableSlotNames,
    occupiedCutouts,
    fixtureIdByCutoutId,
  } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    proceed()
  }
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutConfig = deckConfig.find(cc => (
    cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  ))
  const bodyText = (
    <>
      <StyledText css={BODY_STYLE}>
        {t('select_the_slot', { module: moduleName })}
      </StyledText>
      <Banner type="warning" size={SIZE_1} marginY={SPACING.spacing4}>
        {t('module_secured')}
      </Banner>
    </>
  )

  const handleSetLocation = (loc: ModuleLocation): void => {
    const moduleFixtures = getCutoutFixturesForModuleModel(attachedModule.moduleModel, deckDef)
    const selectedCutoutIds = getCutoutIdsFromModuleSlotName(loc.slotName, moduleFixtures, deckDef)
    if (selectedCutoutIds.every(selectedCutoutId => !(selectedCutoutId in fixtureIdByCutoutId))) {
      updateDeckConfiguration(
        deckConfig.map(cc => {
          if (cc.cutoutId in fixtureIdByCutoutId) { 
            let replacementFixtureId: CutoutFixtureId = SINGLE_LEFT_SLOT_FIXTURE
            if (SINGLE_CENTER_CUTOUTS.includes(cc.cutoutId)){
              replacementFixtureId = SINGLE_CENTER_SLOT_FIXTURE
            } else if (SINGLE_RIGHT_CUTOUTS.includes(cc.cutoutId)) {
              replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
            }
            return {...cc, cutoutFixtureId: replacementFixtureId, opentronsModuleSerialNumber: undefined }
          } else if (selectedCutoutIds.includes(cc.cutoutId)){
            return {
              ...cc, 
              cutoutFixtureId: Object.values(fixtureIdByCutoutId)[0] ?? moduleFixtures[0]?.id ?? cc.cutoutFixtureId,
              opentronsModuleSerialNumber: attachedModule.serialNumber
            }
          } else {
            return cc
          }
        })
      )
    }
  }
  return (
    <GenericWizardTile
      header={t('select_location')}
      rightHandBody={

        <DeckLocationSelect
          deckDef={deckDef}
          selectedLocation={{ slotName: cutoutConfig?.cutoutId.replace('cutout', '') ?? '' }}
          setSelectedLocation={handleSetLocation}
          availableSlotNames={availableSlotNames}
          occupiedCutouts={occupiedCutouts}
          isThermocycler={
            attachedModule.moduleType === THERMOCYCLER_MODULE_TYPE
          }
          showTooltipOnDisabled={true}
        />





      }
      bodyText={bodyText}
      proceedButtonText={t('confirm_location')}
      proceed={handleOnClick}
      proceedIsDisabled={cutoutConfig == null}
      disableProceedReason={
        cutoutConfig == null
          ? 'Current deck configuration prevents module placement'
          : undefined
      }
    />
  )
}
