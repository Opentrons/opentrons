import * as React from 'react'
import map from 'lodash/map'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Link,
  ModuleViz,
  PrimaryBtn,
  RobotWorkSpace,
  Tooltip,
  useHoverTooltip,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  JUSTIFY_CENTER,
  C_BLUE,
  C_NEAR_WHITE,
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'

import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { ModuleTag } from '../ModuleTag'
import { MultipleModulesModal } from './MultipleModulesModal'
import styles from './styles.css'

import type { CoordinatesByModuleModel } from '../utils/getModuleRenderCoords'

interface ModuleSetupProps {
  moduleRenderCoords: CoordinatesByModuleModel
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

export const ModuleSetup = (props: ModuleSetupProps): JSX.Element | null => {
  const { moduleRenderCoords } = props
  const proceedToLabwareDisabled = false
  const proceedToLabwareDisabledReason = 'replace with actual tooltip text'
  const LinkComponent = proceedToLabwareDisabled ? 'button' : NavLink
  const linkProps = proceedToLabwareDisabled ? {} : { to: '/protocol' }
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  return (
    <React.Fragment>
      {showMultipleModulesModal && (
        <MultipleModulesModal
          onClockClick={() => setShowMultipleModulesModal(false)}
        />
      )}
      <Flex
        flex="1"
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
        flexDirection={DIRECTION_COLUMN}
      >
        <Link
          fontSize={FONT_SIZE_BODY_1}
          color={C_BLUE}
          alignSelf={ALIGN_FLEX_END}
          onClick={() => setShowMultipleModulesModal(true)}
          data-test={'LabwareSetup_helpLink'}
        >
          {t('multiple_modules_help_link_title')}
        </Link>

        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={`-64 -10 ${530} ${456}`}
          className={styles.deck_map}
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
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
                      <ModuleTag
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
        <Flex justifyContent={JUSTIFY_CENTER}>
          <PrimaryBtn
            title={t('proceed_to_labware_setup_step')}
            disabled={proceedToLabwareDisabled}
            as={LinkComponent}
            {...linkProps}
            {...targetProps}
          >
            {t('proceed_to_labware_setup_step')}
          </PrimaryBtn>
          {proceedToLabwareDisabled && (
            <Tooltip {...tooltipProps}>
              {proceedToLabwareDisabledReason}
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
