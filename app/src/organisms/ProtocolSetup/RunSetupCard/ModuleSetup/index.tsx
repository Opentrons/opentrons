import * as React from 'react'
import map from 'lodash/map'
import { useDispatch, useSelector } from 'react-redux'

import { useTranslation } from 'react-i18next'
import {
  Flex,
  Btn,
  Link,
  ModuleViz,
  PrimaryBtn,
  RobotWorkSpace,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  C_BLUE,
  C_NEAR_WHITE,
  SPACING_4,
  useInterval,
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import { fetchModules } from '../../../../src/redux/modules/actions'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { ModuleInfo } from './ModuleInfo'
import { MultipleModulesModal } from './MultipleModulesModal'
import styles from '../../styles.css'
import type { CoordinatesByModuleModel } from '../../utils/getModuleRenderCoords'

interface ModuleSetupProps {
  moduleRenderCoords: CoordinatesByModuleModel
  expandLabwareSetupStep: () => void
  robotName: string
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
const POLL_MODULE_INTERVAL_MS = 5000

export const ModuleSetup = (props: ModuleSetupProps): JSX.Element | null => {
  const { moduleRenderCoords, expandLabwareSetupStep, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const DECK_VIEW_BOX = `-64 -10 ${530} ${456}`
  const { t } = useTranslation('protocol_setup')
  const connectedRobotName = useSelector(getConnectedRobotName)
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)

  useInterval(
    () => dispatch(fetchModules(robotName)),
    connectedRobotName === null ? POLL_MODULE_INTERVAL_MS : null,
    true
  )
  return (
    <React.Fragment>
      {showMultipleModulesModal && (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      )}
      <Flex
        flex="1"
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
        flexDirection={DIRECTION_COLUMN}
      >
        <Btn //    TODO IMMEDIATELY: make button show up only when MoaM is attached
          as={Link}
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          alignSelf={ALIGN_FLEX_END}
          onClick={() => setShowMultipleModulesModal(true)}
          data-test={'LabwareSetup_helpLink'}
        >
          {t('multiple_modules_help_link_title')}
        </Btn>

        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={DECK_VIEW_BOX}
          className={styles.deck_map}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          id={'ModuleSetup_deckMap'}
        >
          {() => {
            return (
              <>
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
                      <ModuleInfo
                        x={x}
                        y={y}
                        moduleModel={moduleModel}
                        orientation={orientation}
                      />
                    </React.Fragment>
                  )
                })}
              </>
            )
          }}
        </RobotWorkSpace>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} margin={SPACING_4}>
        <PrimaryBtn
          title={t('proceed_to_labware_setup_step')}
          onClick={expandLabwareSetupStep}
          backgroundColor={C_BLUE}
          id={'ModuleSetup_proceedToLabwareSetup'}
        >
          {t('proceed_to_labware_setup_step')}
        </PrimaryBtn>
      </Flex>
    </React.Fragment>
  )
}
