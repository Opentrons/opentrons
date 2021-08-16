import * as React from 'react'
import map from 'lodash/map'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  Flex,
  LabwareRender,
  Link,
  ModuleViz,
  PrimaryBtn,
  RobotWorkSpace,
  SecondaryBtn,
  Text,
  Tooltip,
  useHoverTooltip,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  SPACING_3,
  SPACING_6,
  C_BLUE,
  C_DARK_GRAY,
  C_NEAR_WHITE,
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { ModuleTag } from '../../ModuleTag'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareSetupModal } from './LabwareSetupModal'
import { getModuleTypesThatRequireExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'
import { ExtraAttentionWarning } from './ExtraAttentionWarning'
import styles from '../../styles.css'
import type { CoordinatesByModuleModel } from '../../utils/getModuleRenderCoords'
import type { CoordinatesByLabwareId } from '../../utils/getLabwareRenderCoords'

interface LabwareSetupProps {
  moduleRenderCoords: CoordinatesByModuleModel
  labwareRenderCoords: CoordinatesByLabwareId
}

const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const DECK_MAP_VIEWBOX = '-80 -100 550 560'

export const LabwareSetup = (props: LabwareSetupProps): JSX.Element | null => {
  const { moduleRenderCoords, labwareRenderCoords } = props
  const moduleModels = map(moduleRenderCoords, ({ moduleModel }) => moduleModel)
  const moduleTypesThatRequireExtraAttention = getModuleTypesThatRequireExtraAttention(
    moduleModels
  )
  const proceedToRunDisabled = false
  const proceedToRunDisabledReason = 'replace with actual tooltip text'
  const LinkComponent = proceedToRunDisabled ? 'button' : NavLink
  const linkProps = proceedToRunDisabled ? {} : { to: '/run' }
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [
    showLabwareHelpModal,
    setShowLabwareHelpModal,
  ] = React.useState<boolean>(false)
  return (
    <React.Fragment>
      {showLabwareHelpModal && (
        <LabwareSetupModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      <Flex
        flex="1"
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
        flexDirection={DIRECTION_COLUMN}
      >
        <Btn
          as={Link}
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          alignSelf={ALIGN_FLEX_END}
          onClick={() => setShowLabwareHelpModal(true)}
          data-test={'LabwareSetup_helpLink'}
        >
          {t('labware_help_link_title')}
        </Btn>
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
                {map(moduleRenderCoords, ({ x, y, moduleModel }) => {
                  const orientation = inferModuleOrientationFromXCoordinate(x)
                  return (
                    <React.Fragment
                      key={`LabwareSetup_Module_${moduleModel}_${x}${y}`}
                    >
                      <ModuleViz
                        x={x}
                        y={y}
                        orientation={orientation}
                        moduleType={getModuleType(moduleModel)}
                      />
                      <ModuleTag
                        x={x}
                        y={y}
                        moduleModel={moduleModel}
                        orientation={orientation}
                      />
                    </React.Fragment>
                  )
                })}
                {map(labwareRenderCoords, ({ x, y, labwareDef }) => {
                  return (
                    <React.Fragment
                      key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                    >
                      <g transform={`translate(${x},${y})`}>
                        <LabwareRender definition={labwareDef} />
                      </g>
                      <g>
                        <LabwareInfoOverlay
                          x={x}
                          y={y}
                          definition={labwareDef}
                        />
                      </g>
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            )
          }}
        </RobotWorkSpace>
        <Text color={C_DARK_GRAY} margin={`${SPACING_6} ${SPACING_3}`}>
          {t('labware_position_check_text')}
        </Text>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <SecondaryBtn
            title={t('check_labware_positions')}
            marginRight={SPACING_3}
            onClick={() => console.log('check labware positions!')}
            color={C_BLUE}
            id={'LabwareSetup_checkLabwarePositionsButton'}
          >
            {t('check_labware_positions')}
          </SecondaryBtn>
          <PrimaryBtn
            title={t('proceed_to_run')}
            disabled={proceedToRunDisabled}
            as={LinkComponent}
            backgroundColor={C_BLUE}
            id={'LabwareSetup_proceedToRunButton'}
            {...linkProps}
            {...targetProps}
          >
            {t('proceed_to_run')}
          </PrimaryBtn>
          {proceedToRunDisabled && (
            <Tooltip {...tooltipProps}>{proceedToRunDisabledReason}</Tooltip>
          )}
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
