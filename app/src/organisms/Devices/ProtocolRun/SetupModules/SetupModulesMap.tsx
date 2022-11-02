import * as React from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  Flex,
  Box,
  Link,
  Module,
  RobotWorkSpace,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { useFeatureFlag } from '../../../../redux/config'
import { HeaterShakerBanner } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/HeaterShakerSetupWizard/HeaterShakerBanner'
import { ModuleInfo } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'
import { UnMatchedModuleWarning } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/UnMatchedModuleWarning'
import { MultipleModulesModal } from '../../../ProtocolSetup/RunSetupCard/ModuleSetup/MultipleModulesModal'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { getStandardDeckViewBox } from '../utils/getStandardDeckViewBox'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'

interface SetupModulesMapProps {
  robotName: string
  runId: string
}

export const SetupModulesMap = ({
  robotName,
  runId,
}: SetupModulesMapProps): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const enableLiquidSetup = useFeatureFlag('enableLiquidSetup')
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const { robotType } = useProtocolDetailsForRun(runId)

  const deckDef = getDeckDefFromRobotType(robotType)
  const {
    missingModuleIds,
    remainingAttachedModules,
  } = useUnmatchedModulesForProtocol(robotName, runId)

  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  const heaterShakerModules = Object.values(
    moduleRenderInfoForProtocolById
  ).filter(module => module.moduleDef.model === 'heaterShakerModuleV1')

  const moduleModels = map(
    moduleRenderInfoForProtocolById,
    ({ moduleDef }) => moduleDef.model
  )

  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length
  return (
    <Flex
      flex="1"
      maxHeight="180vh"
      marginTop={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
    >
      {!enableLiquidSetup && heaterShakerModules.length !== 0 ? (
        <HeaterShakerBanner modules={heaterShakerModules} />
      ) : null}
      {!enableLiquidSetup && showMultipleModulesModal ? (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      ) : null}
      {!enableLiquidSetup && hasADuplicateModule ? (
        <Link
          role="link"
          alignSelf={ALIGN_FLEX_END}
          css={TYPOGRAPHY.labelSemiBold}
          color={COLORS.darkBlackEnabled}
          onClick={() => setShowMultipleModulesModal(true)}
          data-test="ModuleSetup_helpLink"
        >
          {t('multiple_modules_help_link_title')}
        </Link>
      ) : null}
      {!enableLiquidSetup &&
      remainingAttachedModules.length !== 0 &&
      missingModuleIds.length !== 0 ? (
        <UnMatchedModuleWarning />
      ) : null}
      <Box margin="0 auto" maxWidth="46.25rem" width="100%">
        <RobotWorkSpace
          deckDef={deckDef}
          viewBox={getStandardDeckViewBox(robotType)}
          deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
          id="ModuleSetup_deckMap"
        >
          {() => (
            <>
              {map(
                moduleRenderInfoForProtocolById,
                ({ x, y, moduleDef, attachedModuleMatch }) => {
                  const { model } = moduleDef
                  return (
                    <React.Fragment
                      key={`ModuleSetup_Module_${model}_${x}${y}`}
                    >
                      <Module
                        x={x}
                        y={y}
                        orientation={inferModuleOrientationFromXCoordinate(x)}
                        def={moduleDef}
                      >
                        <ModuleInfo
                          moduleModel={model}
                          isAttached={attachedModuleMatch != null}
                          usbPort={attachedModuleMatch?.usbPort.port ?? null}
                          hubPort={attachedModuleMatch?.usbPort.hub ?? null}
                          runId={runId}
                        />
                      </Module>
                    </React.Fragment>
                  )
                }
              )}
            </>
          )}
        </RobotWorkSpace>
      </Box>
    </Flex>
  )
}
