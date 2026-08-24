import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'

import {
  DeckConfigurator,
  InlineNotification,
  RESPONSIVENESS,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  COMBO_FIXTURES,
  FAKE_FIXTURE_IDS,
  FLEX_MODULE_AA_TYPE_BY_MODEL,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getAAByAAId,
  getAAForModuleFixture,
  getAAWithFakesFromCutoutFixtureId,
  getCutoutConfigReplacmentForModule,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  getModuleDisplayName,
  getReplacementFixtureForFakeFixture,
  getReplacementFixtureForFixtureRemoval,
  replaceCutoutFixtureForFixtureRemoval,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  SINGLE_SLOT_FIXTURES,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils/isDoorOpenError'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

import { getFixtureIdByCutoutIdForModule } from './getFixtureIdByCutoutId'

import type { ReactNode } from 'react'
import type { CreateMaintenanceRunType } from '@opentrons/react-api-client'
import type {
  AreaType,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
export interface SelectLocationProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
  createMaintenanceRun: CreateMaintenanceRunType
  isLoadedInRun: boolean
  updateDeckConfiguration: (deckConfig: DeckConfiguration) => void
}
export function SelectLocation(props: SelectLocationProps): ReactNode {
  const {
    proceed,
    attachedModule,
    deckConfig,
    isLoadedInRun,
    createMaintenanceRun,
    maintenanceRunId,
    setErrorMessage,
    setIsDoorOpenError,
    updateDeckConfiguration,
  } = props

  const configuredFixtureIdByCutoutId = getFixtureIdByCutoutIdForModule(
    attachedModule,
    deckConfig
  )

  const deckConfigWithAA =
    replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig)

  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const { parseModuleUSBPort } = useModuleUSBPort()

  const isFlexStacker = attachedModule.moduleType === FLEX_STACKER_MODULE_TYPE
  const isVacuumModule = attachedModule.moduleType === VACUUM_MODULE_TYPE

  const handleOnClick = (): void => {
    if (maintenanceRunId == null) {
      createMaintenanceRun({})
        .catch(error => {
          if (isMaintenanceDoorOpenError(error)) {
            setIsDoorOpenError(true)
            setErrorMessage(t('door_is_open') as string)
          } else {
            setErrorMessage(error.message as string)
          }
        })
        .then(proceed)
    } else {
      proceed()
    }
  }
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
        !isLoadedInRun &&
        mayMountToCutoutIds.includes(cutoutId) &&
        (isCurrentConfiguration ||
          SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) ||
          // fake fixtures include mag block next to an empty staging slot and a waste chute next to an empty staging slot
          FAKE_FIXTURE_IDS.includes(cutoutFixtureId))
      ) {
        return [...acc, cutoutId]
      }
      return acc
    },
    []
  )

  const handleAddFixture = (anchorCutoutId: CutoutId): void => {
    const selectedFixtureIdByCutoutIds =
      getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
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
          } else if (COMBO_FIXTURES.includes(cc.cutoutFixtureId)) {
            const aaForSelectedFixture = getAAWithFakesFromCutoutFixtureId(
              Object.keys(selectedFixtureIdByCutoutIds)[0] as CutoutId,
              selectedFixtureIdByCutoutIds[
                Object.keys(selectedFixtureIdByCutoutIds)[0] as CutoutId
              ] ?? cc.cutoutFixtureId,
              deckDef
            )
            const filteredAAForSelectedFixture = aaForSelectedFixture?.find(
              aa => {
                const aaAreaType = getAAByAAId(aa, deckDef).areaType
                return (
                  Object.values(FLEX_MODULE_AA_TYPE_BY_MODEL).includes(
                    aaAreaType as AreaType
                  ) && aaAreaType !== 'magneticBlock'
                )
              }
            )
            if (filteredAAForSelectedFixture == null) {
              return cc
            }

            const fixtureReplacement = replaceCutoutFixtureForFixtureRemoval(
              cc.cutoutFixtureId,
              cc.cutoutId,
              filteredAAForSelectedFixture
            )
            return {
              ...cc,
              cutoutFixtureId: getReplacementFixtureForFakeFixture(
                fixtureReplacement as CutoutFixtureIdsWithFakes
              ),
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
      updateDeckConfiguration(updatedDeckConfig)
    }
  }

  const handleRemoveFixture = (anchorCutoutId: CutoutId): void => {
    const removedFixtureIdByCutoutIds =
      getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
        anchorCutoutId,
        moduleFixtures
      )
    updateDeckConfiguration(
      deckConfig.map(cc => {
        if (cc.cutoutId in removedFixtureIdByCutoutIds) {
          const fixtureInPlace = deckConfigWithAA.find(
            dc => dc.cutoutId === anchorCutoutId
          )
          const removedDefaultFixture =
            removedFixtureIdByCutoutIds[cc.cutoutId]! // we know there is a match by the condition
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
          <StyledText css={BODY_STYLE}>
            {t('select_the_slot', {
              module: moduleName,
              port: parseModuleUSBPort(attachedModule),
            })}
            {isFlexStacker ? null : ` ${t('location_must_be_correct')}`}
          </StyledText>
          {isFlexStacker || isVacuumModule ? (
            <InlineNotification
              type="neutral"
              message={t('look_for_pulsing_lights')}
            />
          ) : (
            <InlineNotification type="alert" message={t('module_secured')} />
          )}
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
