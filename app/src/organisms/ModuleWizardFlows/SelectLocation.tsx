import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'

import {
  Banner,
  DeckConfigurator,
  LegacyStyledText,
  RESPONSIVENESS,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FAKE_FIXTURE_IDS,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_FIXTURES,
  getAAForModuleFixture,
  getCutoutConfigReplacmentForModule,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  getModuleDisplayName,
  getReplacementFixtureForFixtureRemoval,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'

import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import { getFixtureIdByCutoutId } from './getFixtureIdByCutoutId'

import type { CreateMaintenanceRunType } from '@opentrons/react-api-client'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { ModuleSetupWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
export interface SelectLocationProps extends ModuleSetupWizardStepProps {
  deckConfig: DeckConfiguration
  createMaintenanceRun: CreateMaintenanceRunType
  isLoadedInRun: boolean
}
export function SelectLocation(props: SelectLocationProps): JSX.Element {
  const {
    proceed,
    attachedModule,
    deckConfig,
    isLoadedInRun,
    createMaintenanceRun,
    maintenanceRunId,
    setErrorMessage,
  } = props

  const configuredFixtureIdByCutoutId = getFixtureIdByCutoutId(
    attachedModule,
    deckConfig
  )

  const deckConfigWithAA = replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
    deckConfig
  )

  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    if (maintenanceRunId == null) {
      createMaintenanceRun({}).catch(error => {
        setErrorMessage(error.message as string)
      })
    }
    proceed()
  }
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutConfig = deckConfig.find(
    cc => cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  )

  const moduleFixtures = getCutoutFixturesForModuleModel(
    attachedModule.moduleModel,
    deckDef
  )
  const mayMountToCutoutIds = moduleFixtures.reduce<CutoutId[]>(
    (acc, { mayMountTo }) => [...acc, ...mayMountTo],
    []
  )

  const editableCutoutIds = deckConfigWithAA.reduce<CutoutId[]>(
    (acc, { cutoutId, cutoutFixtureId, opentronsModuleSerialNumber }) => {
      const isCurrentConfiguration =
        Object.values(configuredFixtureIdByCutoutId).includes(
          cutoutFixtureId
        ) && attachedModule.serialNumber === opentronsModuleSerialNumber
      if (
        // in run setup, module calibration only available when module location is already correctly configured
        (!isLoadedInRun &&
          mayMountToCutoutIds.includes(cutoutId) &&
          (isCurrentConfiguration ||
            SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) ||
            // fake fixtures include mag block next to an empty staging slot and a waste chute next to an empty staging slot
            FAKE_FIXTURE_IDS.includes(cutoutFixtureId))) ||
        FLEX_STACKER_FIXTURES.includes(cutoutFixtureId)
      ) {
        return [...acc, cutoutId]
      }
      return acc
    },
    []
  )

  const handleAddFixture = (anchorCutoutId: CutoutId): void => {
    const selectedFixtureIdByCutoutIds = getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
      anchorCutoutId,
      moduleFixtures
    )
    if (!isEqual(selectedFixtureIdByCutoutIds, configuredFixtureIdByCutoutId)) {
      const updatedDeckConfig = deckConfig.map(cc => {
        if (cc.cutoutId in configuredFixtureIdByCutoutId) {
          if (SINGLE_CENTER_CUTOUTS.includes(cc.cutoutId)) {
            return {
              ...cc,
              cutoutFixtureId: SINGLE_CENTER_SLOT_FIXTURE,
              opentronsModuleSerialNumber: undefined,
            }
          } else if (SINGLE_RIGHT_CUTOUTS.includes(cc.cutoutId)) {
            return {
              ...cc,
              cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
              opentronsModuleSerialNumber: undefined,
            }
          }
          return {
            ...cc,
            cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
            opentronsModuleSerialNumber: undefined,
          }
        } else if (cc.cutoutId in selectedFixtureIdByCutoutIds) {
          const fixtureReplacement = getCutoutConfigReplacmentForModule(
            anchorCutoutId,
            selectedFixtureIdByCutoutIds[cc.cutoutId] ?? cc.cutoutFixtureId,
            attachedModule.moduleModel,
            deckConfig
          )
          return {
            ...cc,
            cutoutFixtureId: fixtureReplacement,
            opentronsModuleSerialNumber: attachedModule.serialNumber,
          }
        } else {
          return cc
        }
      })
      console.log('updatedDeckConfig: ', updatedDeckConfig)
      updateDeckConfiguration(updatedDeckConfig)
    }
  }

  const handleRemoveFixture = (anchorCutoutId: CutoutId): void => {
    const removedFixtureIdByCutoutIds = getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
      anchorCutoutId,
      moduleFixtures
    )
    console.log('removedFixtureIdByCutoutIds: ', removedFixtureIdByCutoutIds)
    updateDeckConfiguration(
      deckConfig.map(cc => {
        if (cc.cutoutId in removedFixtureIdByCutoutIds) {
          const fixtureInPlace = deckConfigWithAA.find(
            dc => dc.cutoutId === anchorCutoutId
          )
          const removedDefaultFixture = removedFixtureIdByCutoutIds[
            cc.cutoutId
          ] as CutoutFixtureId // we know there is a match by the condition
          const aa = getAAForModuleFixture(
            anchorCutoutId,
            removedDefaultFixture,
            attachedModule.moduleModel
          )
          const replacment = getReplacementFixtureForFixtureRemoval(
            fixtureInPlace?.cutoutFixtureId ?? removedDefaultFixture,
            anchorCutoutId,
            aa
          )
          return {
            ...cc,
            cutoutFixtureId: replacment,
            opentronsModuleSerialNumber: undefined,
          }
        } else {
          return cc
        }
      })
    )
  }

  return (
    <GenericWizardTile
      header={t('select_location')}
      rightHandBody={
        <DeckConfigurator
          deckConfig={deckConfig}
          handleClickAdd={handleAddFixture}
          handleClickRemove={handleRemoveFixture}
          editableCutoutIds={editableCutoutIds}
          moduleModel={attachedModule.moduleModel}
          selectedCutoutId={
            deckConfig.find(
              ({ cutoutId, opentronsModuleSerialNumber }) =>
                Object.keys(configuredFixtureIdByCutoutId).includes(cutoutId) &&
                attachedModule.serialNumber === opentronsModuleSerialNumber
            )?.cutoutId
          }
          height="250px"
        />
      }
      bodyText={
        <>
          <LegacyStyledText css={BODY_STYLE}>
            {t('select_the_slot', { module: moduleName })}
          </LegacyStyledText>
          <Banner type="warning" size={SIZE_1} marginY={SPACING.spacing4}>
            {t('module_secured')}
          </Banner>
        </>
      }
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
