import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import {
  DIRECTION_COLUMN,
  Flex,
  Module,
  RobotWorkSpace,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { ModuleInfo } from '../ModuleInfo'

import type { HeaterShakerModule } from '../../../redux/modules/types'

const VIEW_BOX = '-150 -38 440 128'
interface PowerOnProps {
  attachedModule: HeaterShakerModule | null
}

export function PowerOn(props: PowerOnProps): JSX.Element {
  const { t } = useTranslation('heater_shaker')
  const moduleDef = getModuleDef2('heaterShakerModuleV1')

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        marginBottom="4rem"
        data-testid="heater_shaker_power_on_text"
      >
        <Trans
          t={t}
          i18nKey="step_2_power_on"
          components={{
            strong: (
              <StyledText
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                paddingBottom={SPACING.spacing12}
              />
            ),
            block: <span />,
          }}
        />
      </Flex>
      <RobotWorkSpace
        viewBox={VIEW_BOX}
        data-testid="heater_shaker_svg_and_info"
      >
        {() => (
          <React.Fragment key={`Power_on_${String(moduleDef.model)}`}>
            <Module
              x={0}
              y={0}
              orientation={inferModuleOrientationFromXCoordinate(0)}
              def={moduleDef}
            >
              <ModuleInfo
                moduleModel={moduleDef.model}
                isAttached={props.attachedModule !== null}
                physicalPort={props.attachedModule?.usbPort ?? null}
              />
            </Module>
          </React.Fragment>
        )}
      </RobotWorkSpace>
    </>
  )
}
