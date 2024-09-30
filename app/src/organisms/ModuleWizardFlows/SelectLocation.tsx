import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  getModuleDisplayName,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  getCutoutFixturesForModuleModel,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_CENTER_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  getFixtureIdByCutoutIdFromModuleAnchorCutoutId,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'
import {
  Banner,
  DeckConfigurator,
  RESPONSIVENESS,
  SIZE_1,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import type { ModuleCalibrationWizardStepProps } from './types'
import type {
  CutoutConfig,
  DeckConfiguration,
  CutoutFixtureId,
  CutoutId,
} from '@opentrons/shared-data'

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
  configuredFixtureIdByCutoutId: { [cutoutId in CutoutId]?: CutoutFixtureId }
  isLoadedInRun: boolean
}
export const SelectLocation = (
  props: SelectLocationProps
): JSX.Element | null => {
  const {
    proceed,
    attachedModule,
    deckConfig,
    configuredFixtureIdByCutoutId,
    isLoadedInRun,
  } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    proceed()
  }
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutConfig = deckConfig.find(
    cc => cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  )
  const bodyText = (
    <>
      <LegacyStyledText css={BODY_STYLE}>
        {t('select_the_slot', { module: moduleName })}
      </LegacyStyledText>
      <Banner type="warning" size={SIZE_1} marginY={SPACING.spacing4}>
        {t('module_secured')}
      </Banner>
    </>
  )

  const moduleFixtures = getCutoutFixturesForModuleModel(
    attachedModule.moduleModel,
    deckDef
  )
  const mayMountToCutoutIds = moduleFixtures.reduce<CutoutId[]>(
    (acc, { mayMountTo }) => [...acc, ...mayMountTo],
    []
  )
  const editableCutoutIds = deckConfig.reduce<CutoutId[]>(
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
          SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId))
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
            return {
              ...cc,
              cutoutFixtureId:
                selectedFixtureIdByCutoutIds[cc.cutoutId] ?? cc.cutoutFixtureId,
              opentronsModuleSerialNumber: attachedModule.serialNumber,
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
