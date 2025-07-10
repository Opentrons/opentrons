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
  getAAForModuleFixture,
  getCutoutFixturesForModuleModel,
  getDeckDefFromRobotType,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  getModuleDisplayName,
  replaceCutoutFixtureWithComboFixture,
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
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  ModuleModel,
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

  console.log('mayMountToCutoutIds: ', mayMountToCutoutIds)

  const editableCutoutIds = deckConfigWithAA.reduce<CutoutId[]>(
    (
      acc,
      {
        cutoutId,
        cutoutFixtureId,
        opentronsModuleSerialNumber,
        addressableAreaId,
      }
    ) => {
      const isCurrentConfiguration =
        Object.values(configuredFixtureIdByCutoutId).includes(
          cutoutFixtureId
        ) && attachedModule.serialNumber === opentronsModuleSerialNumber
      console.log('cutoutId: ', cutoutId)
      console.log('isCurrentConfiguration: ', isCurrentConfiguration)
      console.log(
        'mayMountToCutoutIds.includes(cutoutId); ',
        mayMountToCutoutIds.includes(cutoutId)
      )
      console.log('isLoadedInRun; ', isLoadedInRun)
      console.log(
        'SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId): ',
        SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
      )
      console.log('addressableAreaId: ', addressableAreaId)
      console.log('cutoutFixtureId: ', cutoutFixtureId)
      if (
        // in run setup, module calibration only available when module location is already correctly configured
        !isLoadedInRun &&
        mayMountToCutoutIds.includes(cutoutId) &&
        (isCurrentConfiguration ||
          SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) ||
          FAKE_FIXTURE_IDS.includes(cutoutFixtureId))
      ) {
        return [...acc, cutoutId]
      }
      return acc
    },
    []
  )

  const handleAddFixture = (anchorCutoutId: CutoutId): void => {
    console.log('handleAddFixtures')
    const selectedFixtureIdByCutoutIds = getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
      anchorCutoutId,
      moduleFixtures
    )
    console.log('selectedFixtureIdByCutoutIds: ', selectedFixtureIdByCutoutIds)
    console.log(
      'configuredFixtureIdByCutoutId: ',
      configuredFixtureIdByCutoutId
    )
    if (!isEqual(selectedFixtureIdByCutoutIds, configuredFixtureIdByCutoutId)) {
      updateDeckConfiguration(
        deckConfig.map(cc => {
          if (cc.cutoutId in configuredFixtureIdByCutoutId) {
            let replacementFixtureId: CutoutFixtureId = SINGLE_LEFT_SLOT_FIXTURE
            if (SINGLE_CENTER_CUTOUTS.includes(cc.cutoutId)) {
              replacementFixtureId = SINGLE_CENTER_SLOT_FIXTURE
            } else if (SINGLE_RIGHT_CUTOUTS.includes(cc.cutoutId)) {
              replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
            }
            return {
              ...cc,
              cutoutFixtureId: replacementFixtureId,
              opentronsModuleSerialNumber: undefined,
            }
          } else if (cc.cutoutId in selectedFixtureIdByCutoutIds) {
            const replacement = getCutoutConfigReplacment(
              anchorCutoutId,
              selectedFixtureIdByCutoutIds[cc.cutoutId] ?? cc.cutoutFixtureId,
              attachedModule.moduleModel,
              deckConfig,
              attachedModule.serialNumber
            )
            return {
              ...cc,
              ...replacement,
            }
          } else {
            return cc
          }
        })
      )
    }
  }

  const handleRemoveFixture = (anchorCutoutId: CutoutId): void => {
    const removedFixtureIdByCutoutIds = getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
      anchorCutoutId,
      moduleFixtures
    )
    updateDeckConfiguration(
      deckConfig.map(cc => {
        if (cc.cutoutId in removedFixtureIdByCutoutIds) {
          let replacementFixtureId: CutoutFixtureId = SINGLE_LEFT_SLOT_FIXTURE
          if (SINGLE_CENTER_CUTOUTS.includes(cc.cutoutId)) {
            replacementFixtureId = SINGLE_CENTER_SLOT_FIXTURE
          } else if (SINGLE_RIGHT_CUTOUTS.includes(cc.cutoutId)) {
            replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
          }
          return {
            ...cc,
            cutoutFixtureId: replacementFixtureId,
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

export const getCutoutConfigReplacment = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureId,
  moduleModel: ModuleModel,
  deckConfig: CutoutConfig[],
  serialNumber?: string
): CutoutConfig => {
  const deckConfigWithAA = replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(
    deckConfig
  )
  const mainAA = getAAForModuleFixture(cutoutId, fixtureId, moduleModel)
  console.log('mainAA: ', mainAA)
  const addedCutoutConfigs: CutoutConfigMap[] = [
    {
      addressableAreaId: mainAA,
      cutoutFixtureId: fixtureId,
      cutoutId: cutoutId,
    },
  ]
  const replacmentFixture = replaceCutoutFixtureWithComboFixture(
    addedCutoutConfigs,
    deckConfigWithAA,
    cutoutId
  )

  console.log('replacmentFixture: ', replacmentFixture)

  return {
    cutoutId,
    cutoutFixtureId: replacmentFixture[0].cutoutFixtureId as CutoutFixtureId,
    opentronsModuleSerialNumber: serialNumber,
  }
}
