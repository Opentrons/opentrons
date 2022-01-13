import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import {
  Flex,
  Btn,
  Link,
  Module,
  NewPrimaryBtn,
  RobotWorkSpace,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  C_BLUE,
  useInterval,
  Tooltip,
  useHoverTooltip,
  ALIGN_CENTER,
} from '@opentrons/components'
import { inferModuleOrientationFromXCoordinate } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useModuleMatchResults } from '../hooks'
import { fetchModules } from '../../../../redux/modules'
import { ModuleInfo } from './ModuleInfo'
import { ModulesMismatch } from './ModulesMismatch'
import { MultipleModulesModal } from './MultipleModulesModal'
import { useModuleRenderInfoById } from '../../hooks'
import styles from '../../styles.css'

import type { Dispatch } from '../../../../redux/types'

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

  const missingModuleIdInfo = useModuleMatchResults()
  useInterval(
    () => dispatch(fetchModules(robotName)),
    robotName === null ? POLL_MODULE_INTERVAL_MS : null,
    true
  )
  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )

  const hasADuplicateModule = new Set(moduleModels).size !== moduleModels.length

  const { missingModuleIds, remainingAttachedModules } = missingModuleIdInfo

  const proceedToLabwareDisabledReason =
    missingModuleIds.length > 0
      ? t('plug_in_required_module', { count: missingModuleIds.length })
      : null

  return (
    <Flex flex="1" maxHeight="80vh" flexDirection={DIRECTION_COLUMN}>
      {showMultipleModulesModal && (
        <MultipleModulesModal
          onCloseClick={() => setShowMultipleModulesModal(false)}
        />
      )}
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

      <ModulesMismatch remainingAttachedModules={remainingAttachedModules} />

      <RobotWorkSpace
        deckDef={standardDeckDef as any}
        viewBox={DECK_VIEW_BOX}
        className={styles.deck_map}
        deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
        id={'ModuleSetup_deckMap'}
      >
        {() => (
          <>
            {map(
              moduleRenderInfoById,
              ({ x, y, moduleDef, attachedModuleMatch }) => {
                const { model } = moduleDef
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
                        usbPort={attachedModuleMatch?.usbPort.port ?? null}
                        hubPort={attachedModuleMatch?.usbPort.hub ?? null}
                      />
                    </Module>
                  </React.Fragment>
                )
              }
            )}
          </>
        )}
      </RobotWorkSpace>
      <NewPrimaryBtn
        title={t('proceed_to_labware_setup_step')}
        disabled={proceedToLabwareDisabledReason != null}
        onClick={expandLabwareSetupStep}
        id={'ModuleSetup_proceedToLabwareSetup'}
        width="18rem"
        alignSelf={ALIGN_CENTER}
        {...targetProps}
      >
        {t('proceed_to_labware_setup_step')}
      </NewPrimaryBtn>
      {proceedToLabwareDisabledReason != null && (
        <Tooltip {...tooltipProps}>{proceedToLabwareDisabledReason}</Tooltip>
      )}
    </Flex>
  )
}
