import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'react-i18next'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Btn,
  Flex,
  LabwareRender,
  Link,
  Module,
  RobotWorkSpace,
  NewSecondaryBtn,
  Text,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_LEFT,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  SPACING_3,
  C_BLUE,
  C_DARK_GRAY,
  DIRECTION_ROW,
  Box,
  FONT_WEIGHT_SEMIBOLD,
  C_NEAR_WHITE,
  SPACING_7,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'

import { useRunStatus } from '../../../RunTimeControl/hooks'
import { LabwarePositionCheck } from '../../LabwarePositionCheck'
import styles from '../../styles.css'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../../hooks'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareOffsetModal } from './LabwareOffsetModal'
import { getModuleTypesThatRequireExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'
import { ExtraAttentionWarning } from './ExtraAttentionWarning'
import { useMissingModuleIds, useProtocolCalibrationStatus } from '../hooks'

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const DECK_MAP_VIEWBOX = '-80 -40 550 500'

export const LabwareSetup = (): JSX.Element | null => {
  const moduleRenderInfoById = useModuleRenderInfoById()
  const labwareRenderInfoById = useLabwareRenderInfoById()
  const missingModuleIds = useMissingModuleIds()
  const isEverythingCalibrated = useProtocolCalibrationStatus().complete
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const runStatus = useRunStatus()
  const { protocolData } = useProtocolDetails()
  const { t } = useTranslation('protocol_setup')
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)

  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )
  const [
    showLabwarePositionCheckModal,
    setShowLabwarePositionCheckModal,
  ] = React.useState<boolean>(false)
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isEverythingCalibrated
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isEverythingCalibrated
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isEverythingCalibrated

  let lpcDisabledReason: string | null = null

  if (moduleAndCalibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_and_calibration_not_complete')
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_not_connected"')
  } else if (runStatus != null && runStatus !== RUN_STATUS_IDLE) {
    lpcDisabledReason = t('labware_position_check_not_available')
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t('labware_position_check_not_available_empty_protocol')
  }

  return (
    <React.Fragment>
      {showLabwareHelpModal && (
        <LabwareOffsetModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      {showLabwarePositionCheckModal && (
        <LabwarePositionCheck
          onCloseClick={() => setShowLabwarePositionCheckModal(false)}
        />
      )}
      <Flex flex="1" maxHeight="85vh" flexDirection={DIRECTION_COLUMN}>
        {moduleTypesThatRequireExtraAttention.length > 0 && (
          <ExtraAttentionWarning
            moduleTypes={moduleTypesThatRequireExtraAttention}
          />
        )}
        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={DECK_MAP_VIEWBOX}
          className={styles.deck_map}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          id={'LabwareSetup_deckMap'}
        >
          {() => {
            return (
              <React.Fragment>
                {map(
                  moduleRenderInfoById,
                  ({ x, y, moduleDef, nestedLabwareDef, nestedLabwareId }) => (
                    <Module
                      key={`LabwareSetup_Module_${moduleDef.model}_${x}${y}`}
                      x={x}
                      y={y}
                      orientation={inferModuleOrientationFromXCoordinate(x)}
                      def={moduleDef}
                      innerProps={
                        moduleDef.model === THERMOCYCLER_MODULE_V1
                          ? { lidMotorState: 'open' }
                          : {}
                      }
                    >
                      {nestedLabwareDef != null && nestedLabwareId != null ? (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                        >
                          <LabwareRender definition={nestedLabwareDef} />
                          <LabwareInfoOverlay
                            definition={nestedLabwareDef}
                            labwareId={nestedLabwareId}
                          />
                        </React.Fragment>
                      ) : null}
                    </Module>
                  )
                )}
                {map(
                  labwareRenderInfoById,
                  ({ x, y, labwareDef }, labwareId) => {
                    return (
                      <React.Fragment
                        key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                      >
                        <g transform={`translate(${x},${y})`}>
                          <LabwareRender definition={labwareDef} />
                          <LabwareInfoOverlay
                            definition={labwareDef}
                            labwareId={labwareId}
                          />
                        </g>
                      </React.Fragment>
                    )
                  }
                )}
              </React.Fragment>
            )
          }}
        </RobotWorkSpace>
        <Flex flexDirection={DIRECTION_ROW} backgroundColor={C_NEAR_WHITE}>
          <Box flexDirection={DIRECTION_COLUMN} width="65%">
            <Text
              color={C_DARK_GRAY}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginLeft={SPACING_3}
              marginTop={SPACING_3}
            >
              {t('lpc_and_offset_data_title')}
            </Text>
            <Text color={C_DARK_GRAY} margin={SPACING_3}>
              {t('labware_position_check_text')}
            </Text>
          </Box>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Btn
              as={Link}
              fontSize={FONT_SIZE_BODY_1}
              color={C_BLUE}
              alignSelf={ALIGN_FLEX_END}
              onClick={() => setShowLabwareHelpModal(true)}
              data-test={'LabwareSetup_helpLink'}
              marginTop={SPACING_3}
              marginBottom={SPACING_3}
            >
              {t('labware_help_link_title')}
            </Btn>
            <Flex justifyContent={JUSTIFY_CENTER}>
              <NewSecondaryBtn
                title={t('run_labware_position_check')}
                onClick={() => setShowLabwarePositionCheckModal(true)}
                id={'LabwareSetup_checkLabwarePositionsButton'}
                {...targetProps}
                disabled={lpcDisabledReason !== null}
              >
                {t('run_labware_position_check')}
              </NewSecondaryBtn>
              {lpcDisabledReason !== null ? (
                <Tooltip maxWidth={SPACING_7} {...tooltipProps}>
                  {lpcDisabledReason}
                </Tooltip>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
