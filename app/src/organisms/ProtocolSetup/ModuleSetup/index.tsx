import * as React from 'react'
import map from 'lodash/map'
import { useTranslation } from 'react-i18next'
import {
  Flex,
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
} from '@opentrons/components'
import {
  getModuleType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { ModuleTag } from '../ModuleTag'
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

const DECK_MAP_VIEWBOX = '-64 -100 650 550'

export const ModuleSetup = (props: ModuleSetupProps): JSX.Element | null => {
  const { moduleRenderCoords } = props
  const { t } = useTranslation('protocol_setup')
  return (
    <React.Fragment>
      <Flex
        flex="1"
        backgroundColor={C_NEAR_WHITE}
        borderRadius="6px"
        flexDirection={DIRECTION_COLUMN}
      >
        <RobotWorkSpace
          deckDef={standardDeckDef as any}
          viewBox={DECK_MAP_VIEWBOX}
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
            backgroundColor={C_BLUE}
          >
            {t('proceed_to_labware_setup_step')}
          </PrimaryBtn>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
