import * as React from 'react'
import { useSelector } from 'react-redux'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import some from 'lodash/some'
import { useTranslation } from 'react-i18next'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import * as Config from '../../../../redux/config'
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
import { DownloadOffsetDataModal } from '../../../ProtocolUpload/DownloadOffsetDataModal'
import { useLPCSuccessToast } from '../../hooks'
import { useModuleMatchResults, useProtocolCalibrationStatus } from '../hooks'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareOffsetModal } from './LabwareOffsetModal'
import { getModuleTypesThatRequireExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'
import { ExtraAttentionWarning } from './ExtraAttentionWarning'

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
  const moduleMatchResults = useModuleMatchResults()
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
  const { missingModuleIds } = moduleMatchResults
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isEverythingCalibrated
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isEverythingCalibrated
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isEverythingCalibrated

  const tipRackLoadedInProtocol: boolean = some(
    protocolData?.labwareDefinitions,
    def => def.parameters?.isTiprack
  )

  const [downloadOffsetDataModal, showDownloadOffsetDataModal] = React.useState(
    false
  )
  const isLabwareOffsetCodeSnippetsOn = useSelector(
    Config.getIsLabwareOffsetCodeSnippetsOn
  )
  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  let lpcDisabledReason: string | null = null

  if (moduleAndCalibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_and_calibration_not_complete')
  } else if (calibrationIncomplete) {
    lpcDisabledReason = t('lpc_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    lpcDisabledReason = t('lpc_disabled_modules_not_connected')
  } else if (runStatus != null && runStatus !== RUN_STATUS_IDLE) {
    lpcDisabledReason = t('labware_position_check_not_available')
  } else if (
    isEmpty(protocolData?.pipettes) ||
    isEmpty(protocolData?.labware)
  ) {
    lpcDisabledReason = t('labware_position_check_not_available_empty_protocol')
  } else if (!tipRackLoadedInProtocol) {
    lpcDisabledReason = t('lpc_disabled_no_tipracks_loaded')
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
      {downloadOffsetDataModal && (
        <DownloadOffsetDataModal
          onCloseClick={() => showDownloadOffsetDataModal(false)}
        />
      )}
      <Flex flex="1" maxHeight="100vh" flexDirection={DIRECTION_COLUMN}>
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
        <Flex
          flexDirection={DIRECTION_ROW}
          backgroundColor={C_NEAR_WHITE}
          padding={SPACING_3}
        >
          <Box flexDirection={DIRECTION_COLUMN} width="65%">
            <Text color={C_DARK_GRAY} fontWeight={FONT_WEIGHT_SEMIBOLD}>
              {t('lpc_and_offset_data_title')}
            </Text>
            <Text
              color={C_DARK_GRAY}
              marginRight={SPACING_3}
              marginY={SPACING_3}
            >
              {t('labware_position_check_text')}
            </Text>
            {isLabwareOffsetCodeSnippetsOn ? (
              <Link
                role={'link'}
                fontSize={FONT_SIZE_BODY_1}
                color={C_BLUE}
                onClick={() => showDownloadOffsetDataModal(true)}
                id={'DownloadOffsetData'}
              >
                {t('get_labware_offset_data')}
              </Link>
            ) : null}
          </Box>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Btn
              as={Link}
              fontSize={FONT_SIZE_BODY_1}
              color={C_BLUE}
              alignSelf={ALIGN_FLEX_END}
              onClick={() => setShowLabwareHelpModal(true)}
              data-test={'LabwareSetup_helpLink'}
              marginY={SPACING_3}
            >
              {t('labware_help_link_title')}
            </Btn>
            <Flex justifyContent={JUSTIFY_CENTER}>
              <NewSecondaryBtn
                title={t('run_labware_position_check')}
                onClick={() => {
                  setShowLabwarePositionCheckModal(true)
                  setIsShowingLPCSuccessToast(false)
                }}
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
