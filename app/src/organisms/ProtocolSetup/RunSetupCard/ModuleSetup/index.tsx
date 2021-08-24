import * as React from 'react'
import map from 'lodash/map'
import { useDispatch, useSelector } from 'react-redux'
import { getConnectedRobotName } from '../../../../redux/robot/selectors'
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
  fetchModules,
  getAttachedModules,
} from '../../../../redux/modules'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
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
}

export function ModuleSetup(props: ModuleSetupProps): JSX.Element {
  const { moduleRenderCoords, expandLabwareSetupStep, robotName} = props
  const dispatch = useDispatch<Dispatch>()
  const moduleModels = map(moduleRenderCoords, ({ moduleModel }) => moduleModel)
  let moduleModelsString = moduleModels.toString()
  const moduleModelsStrings = moduleModelsString.split(',')
  const connectedRobotName = useSelector(getConnectedRobotName)
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  console.log('test', moduleModelsStrings, '1 string', moduleModelsString)
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('protocol_setup')
  const modulesByPort = attachedModules.reduce<{ [port: string]: AttachedModule[] }>(
    (portMap, module) => {
      const port = module.usbPort.hub || module.usbPort.port
      if (port !== null) {
        const portContents = portMap[port] ?? []
        portMap[port] = [...portContents, module]
      }
      return portMap
    },
    {}
  )
  const hasADuplicateModule = 
    Object.values(moduleRenderCoords).some(
      m => Array.isArray(m) && m.length > 1
    )
  console.log(hasADuplicateModule)

console.log('attachedmodules', attachedModules)
const sameModules = attachedModules.filter(attachedModule => (attachedModule.model === moduleModelsString))
console.log('sameModules here', sameModules)                   

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
        {hasADuplicateModule ? (
        <Btn
          as={Link}
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          alignSelf={ALIGN_FLEX_END}
          onClick={() => setShowMultipleModulesModal(true)}
          data-test={'LabwareSetup_helpLink'}
        >
          {t('multiple_modules_help_link_title')}
        </Btn>
        ) : (
          null
        )
        }

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
                  const attached = attachedModules.some(attachedModule => (moduleModel === attachedModule.model))                   
                  if (isEmpty(modulesByPort)) {
                  return (
                    attached === true ?
                    (
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
                        isAttached={attached}
                        usbPort={null}
                        hubPort={null}
                      />
                    </React.Fragment>
                  ) : (
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
                      isAttached={attached}
                      usbPort={null}
                      hubPort={null}
                    />     
                  </React.Fragment>
                  )
                  )
                  } else {
                    return Object.keys(modulesByPort).map(port =>
                      attached === true ?
                      (
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
                          isAttached={attached}
                          usbPort={port}
                          hubPort={port}
                        />
                      </React.Fragment>
                    ) : (
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
                        isAttached={attached}
                        usbPort={null}
                        hubPort={null}
                      />     
                    </React.Fragment>
                    )
                    )
                  }
                })}
              </>
            )
          }}
        </RobotWorkSpace>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} margin={SPACING_4}>
        {sameModules.length === moduleModelsStrings.length ? 
        (
        <PrimaryBtn
          title={t('proceed_to_labware_setup_step')}
          disabled={false}
          onClick={expandLabwareSetupStep}
          backgroundColor={C_BLUE}
          id={'ModuleSetup_proceedToLabwareSetup'}
        >
          {t('proceed_to_labware_setup_step')}
        </PrimaryBtn>
       ) : (
        <PrimaryBtn
        title={t('proceed_to_labware_setup_step')}
        disabled={true}
        onClick={expandLabwareSetupStep}
        backgroundColor={C_BLUE}
      >
        {t('proceed_to_labware_setup_step')}
      </PrimaryBtn>
      )
      } 
      </Flex>
    </React.Fragment>
  )
}

