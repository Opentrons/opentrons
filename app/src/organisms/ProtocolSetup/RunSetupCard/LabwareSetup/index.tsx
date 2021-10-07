import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  Flex,
  LabwareRender,
  Link,
  Module,
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
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { LabwarePositionCheck } from '../../LabwarePositionCheck'
import { LabwareInfoOverlay } from './LabwareInfoOverlay'
import { LabwareSetupModal } from './LabwareSetupModal'
import { getModuleTypesThatRequireExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'
import { ExtraAttentionWarning } from './ExtraAttentionWarning'
import styles from '../../styles.css'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../../hooks'

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
        <LabwareSetupModal
          onCloseClick={() => setShowLabwareHelpModal(false)}
        />
      )}
      {showLabwarePositionCheckModal && (
        <LabwarePositionCheck
          onCloseClick={() => setShowLabwarePositionCheckModal(false)}
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
                {map(
                  moduleRenderInfoById,
                  ({ x, y, moduleDef, nestedLabwareDef }) => (
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
                      {nestedLabwareDef != null ? (
                        <React.Fragment
                          key={`LabwareSetup_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                        >
                          <LabwareRender definition={nestedLabwareDef} />
                          <LabwareInfoOverlay definition={nestedLabwareDef} />
                        </React.Fragment>
                      ) : null}
                    </Module>
                  )
                )}
                {map(labwareRenderInfoById, ({ x, y, labwareDef }) => {
                  return (
                    <React.Fragment
                      key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                    >
                      <g transform={`translate(${x},${y})`}>
                        <LabwareRender definition={labwareDef} />
                        <LabwareInfoOverlay definition={labwareDef} />
                      </g>
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
            marginRight={SPACING_3}
            onClick={() => setShowLabwarePositionCheckModal(true)}
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