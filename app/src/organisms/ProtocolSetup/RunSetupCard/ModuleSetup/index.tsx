import * as React from 'react'
import map from 'lodash/map'
import { useDispatch, useSelector } from 'react-redux'
import { getConnectedRobotName } from '../../../../redux/robot/selectors'
import { useTranslation } from 'react-i18next'
import isEmpty from 'lodash/isEmpty'
import mapValues from 'lodash/mapValues'
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
  fetchModules,
  getModuleControlsDisabled,
  getAttachedModules,
} from '../../../../redux/modules'
import {
  getModuleType,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  DeckSlot,
  DeckSlotId,
  ModuleModel,
} from '@opentrons/shared-data'
import { getMatchedModules } from '../../../../redux/modules'
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
const DECK_VIEW_BOX = `-64 -10 ${530} ${456}`

interface ModuleSetupProps {
  moduleRenderCoords: CoordinatesByModuleModel
  expandLabwareSetupStep: () => void
  robotName: string
  mode: React.ComponentProps<typeof ModuleInfo>['mode']
  
}
interface ModulesListByPort {
  [port: string]: AttachedModule[]
}


export function ModuleSetup(props: ModuleSetupProps): JSX.Element {
  const { moduleRenderCoords, expandLabwareSetupStep, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const connectedRobotName = useSelector(getConnectedRobotName)
  const modules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('protocol_setup')

  console.log('modules attached are', modules)

  const modulesByPort = modules.reduce<{ [port: string]: AttachedModule[] }>(
    (portMap, module) => {
      const port = module.usbPort.hub || module.usbPort.port
      console.log('port is ', port)
      if (port !== null) {
        const portContents = portMap[port] ?? []
        portMap[port] = [...portContents, module]
      }
      console.log('portmap', portMap)
      return portMap

    },
    {}
  )
  console.log(modulesByPort, 'this is modules by port')
  
  // const modulesList = isEmpty(modulesByPort)
  //   ? null
  //   : moduleWithUSBInfo(modulesByPort, controlDisabledReason)

const fullModule = { ...moduleRenderCoords, ...modulesByPort};
console.log('full module is ', fullModule)

//{usbPort === null && hubPort === null
//  ? mode === 'missing'
//  : mode === 'present'}

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

                {map(moduleRenderCoords, ({ x, y, moduleModel}) => {
                  const orientation = inferModuleOrientationFromXCoordinate(x)

                  return Object.keys(modulesByPort).map(port => (
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
                        mode = {'present'}
                        usbPort={port}
                        hubPort={port}
                        //module = {modulesByPort[port][0]}
                        key={modulesByPort[port][0].serial}
                      />
                      )
                    </React.Fragment>
                  )
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

