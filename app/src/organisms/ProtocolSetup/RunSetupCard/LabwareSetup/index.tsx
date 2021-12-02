import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  Btn,
  Flex,
  LabwareRender,
  Link,
  Module,
  RobotWorkSpace,
  SecondaryBtn,
  Text,
  Tooltip,
  useHoverTooltip,
  TEXT_ALIGN_CENTER,
  TOOLTIP_LEFT,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  SIZE_5,
  SPACING_3,
  C_BLUE,
  C_DARK_GRAY,
  DIRECTION_ROW,
  Box,
  FONT_WEIGHT_SEMIBOLD,
  C_NEAR_WHITE,
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
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })
  const runStatus = useRunStatus()
  const disableLabwarePositionCheck =
    runStatus != null && runStatus !== RUN_STATUS_IDLE
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
              <SecondaryBtn
                title={t('run_labware_position_check')}
                onClick={() => setShowLabwarePositionCheckModal(true)}
                color={C_BLUE}
                id={'LabwareSetup_checkLabwarePositionsButton'}
                {...targetProps}
                disabled={disableLabwarePositionCheck}
              >
                {t('run_labware_position_check')}
              </SecondaryBtn>
              {disableLabwarePositionCheck ? (
                <Tooltip {...tooltipProps}>
                  {
                    <Box width={SIZE_5} textAlign={TEXT_ALIGN_CENTER}>
                      {t('labware_position_check_not_available')}
                    </Box>
                  }
                </Tooltip>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
