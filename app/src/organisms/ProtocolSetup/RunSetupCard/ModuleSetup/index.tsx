import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
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
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useAttachedModulesEqualsProtocolModules } from '../useAttachedModulesEqualsProtocolModules'
import { fetchModules, getAttachedModules } from '../../../../redux/modules'
import { ModuleInfo } from './ModuleInfo'
import { MultipleModulesModal } from './MultipleModulesModal'
import styles from '../../styles.css'
import type { CoordinatesByModuleModel } from '../../utils/getModuleRenderCoords'
import type { State, Dispatch } from '../../../../redux/types'
import type { AttachedModule } from '../../../../redux/modules/types'

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
  const { moduleRenderCoords, expandLabwareSetupStep, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const proceedToLabwareDisabledReason =
    'Plug in and power up the required modules to continue'
  const moduleModels = map(moduleRenderCoords, ({ moduleModel }) => moduleModel)
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation('protocol_setup')
  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length
  const { allModulesAttached } = useAttachedModulesEqualsProtocolModules()
  const proceedToLabwareDisabled = !allModulesAttached
  const modulesByPort = attachedModules.reduce<{
    [port: string]: AttachedModule[]
  }>((portMap, module) => {
    const port = module.usbPort.hub || module.usbPort.port
    if (port !== null) {
      const portContents = portMap[port] ?? []
      portMap[port] = [...portContents, module]
    }
    return portMap
  }, {})

  useInterval(
    () => dispatch(fetchModules(robotName)),
    robotName === null ? POLL_MODULE_INTERVAL_MS : null,
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
        ) : null}
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
                  const attached = attachedModules.some(
                    attachedModule => moduleModel === attachedModule.model
                  )
                  if (isEmpty(modulesByPort)) {
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
                          isAttached={attached}
                          usbPort={null}
                          hubPort={null}
                        />
                      </React.Fragment>
                    )
                  } else {
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
                          isAttached={attached}
                          usbPort={attached === true ? port : null}
                          hubPort={attached === true ? port : null}
                        />
                      </React.Fragment>
                    ))
                  }
                })}
              </>
            )
          }}
        </RobotWorkSpace>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} margin={SPACING_4}>
        <PrimaryBtn
          title={t('proceed_to_labware_setup_step')}
          disabled={proceedToLabwareDisabled}
          onClick={expandLabwareSetupStep}
          backgroundColor={C_BLUE}
          id={'ModuleSetup_proceedToLabwareSetup'}
          {...targetProps}
        >
          {t('proceed_to_labware_setup_step')}
        </PrimaryBtn>
        {proceedToLabwareDisabled && (
          <Tooltip {...tooltipProps}>{proceedToLabwareDisabledReason}</Tooltip>
        )}
      </Flex>
    </React.Fragment>
  )
}
