import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  Flex,
  Btn,
  Link,
  Module,
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
import { inferModuleOrientationFromXCoordinate } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useMissingModuleIds } from '../hooks'
import { fetchModules, getAttachedModules } from '../../../../redux/modules'
import { ModuleInfo } from './ModuleInfo'
import { MultipleModulesModal } from './MultipleModulesModal'
import { useModuleRenderInfoById } from '../../hooks'
import styles from '../../styles.css'

import type { State, Dispatch } from '../../../../redux/types'

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
const DECK_VIEW_BOX = '-80 -40 550 510'

interface ModuleSetupProps {
  expandLabwareSetupStep: () => void
  robotName: string
}

export function ModuleSetup(props: ModuleSetupProps): JSX.Element {
  const { expandLabwareSetupStep, robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const moduleRenderInfoById = useModuleRenderInfoById()
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const missingModuleIds = useMissingModuleIds()
  useInterval(
    () => dispatch(fetchModules(robotName)),
    robotName === null ? POLL_MODULE_INTERVAL_MS : null,
    true
  )
  const attachedModules = useSelector((state: State) =>
    getAttachedModules(state, robotName)
  )

  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )

  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length

  const proceedToLabwareDisabledReason =
    missingModuleIds.length > 0
      ? t('plug_in_required_module', { count: missingModuleIds.length })
      : null

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
          {() => (
            <>
              {map(moduleRenderInfoById, ({ x, y, moduleDef }) => {
                const { model } = moduleDef
                const attachedModuleMatch = attachedModules.find(
                  attachedModule => model === attachedModule.model
                )
                console.log({ attachedModuleMatch })
                console.log({
                  model,
                  isAttached: attachedModuleMatch != null,
                  port: attachedModuleMatch?.usbPort.port,
                  hub: attachedModuleMatch?.usbPort.hub,
                })
                return (
                  <React.Fragment key={`LabwareSetup_Module_${model}_${x}${y}`}>
                    <Module
                      x={x}
                      y={y}
                      orientation={inferModuleOrientationFromXCoordinate(x)}
                      def={moduleDef}
                    >
                      <ModuleInfo
                        moduleModel={model}
                        isAttached={attachedModuleMatch != null}
                        usbPort={attachedModuleMatch?.usbPort.port}
                        hubPort={attachedModuleMatch?.usbPort.hub}
                      />
                    </Module>
                  </React.Fragment>
                )
              })}
            </>
          )}
        </RobotWorkSpace>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} margin={SPACING_4}>
        <PrimaryBtn
          title={t('proceed_to_labware_setup_step')}
          disabled={proceedToLabwareDisabledReason != null}
          onClick={expandLabwareSetupStep}
          backgroundColor={C_BLUE}
          id={'ModuleSetup_proceedToLabwareSetup'}
          {...targetProps}
        >
          {t('proceed_to_labware_setup_step')}
        </PrimaryBtn>
        {proceedToLabwareDisabledReason != null && (
          <Tooltip {...tooltipProps}>{proceedToLabwareDisabledReason}</Tooltip>
        )}
      </Flex>
    </React.Fragment>
  )
}
