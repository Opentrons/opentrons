import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  Flex,
  LabwareRender,
  Link,
  ModuleViz,
  RobotWorkSpace,
  SecondaryBtn,
  Text,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  SPACING_3,
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
import { useModuleRenderInfoById } from '../../hooks'
import type { CoordinatesByLabwareId } from '../../utils/getLabwareRenderCoords'

interface LabwareSetupProps {
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
const DECK_MAP_VIEWBOX = '-80 -40 550 500'

export const LabwareSetup = (props: LabwareSetupProps): JSX.Element | null => {
  const { labwareRenderCoords } = props
  const { t } = useTranslation('protocol_setup')
  const moduleRenderInfoById = useModuleRenderInfoById()
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
                {map(moduleRenderInfoById, ({ x, y, moduleDef }) => {
                  const { model } = moduleDef
                  const orientation = inferModuleOrientationFromXCoordinate(x)
                  return (
                    <React.Fragment
                      key={`LabwareSetup_Module_${model}_${x}${y}`}
                    >
                      <ModuleViz
                        x={x}
                        y={y}
                        orientation={orientation}
                        moduleType={getModuleType(model)}
                      />
                      <ModuleTag
                        x={x}
                        y={y}
                        moduleModel={model}
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
                      <LabwareInfoOverlay x={x} y={y} definition={labwareDef} />
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            )
          }}
        </RobotWorkSpace>
        <Text as={'h4'} marginLeft={SPACING_3}>
          Labware Position Check
        </Text>
        <Text color={C_DARK_GRAY} margin={SPACING_3}>
          {t('labware_position_check_text')}
        </Text>
        <Flex justifyContent={JUSTIFY_CENTER}>
          <SecondaryBtn
            title={t('check_labware_positions')}
            onClick={() => console.log('check labware positions!')}
            color={C_BLUE}
            id={'LabwareSetup_checkLabwarePositionsButton'}
          >
            {t('check_labware_positions')}
          </SecondaryBtn>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
