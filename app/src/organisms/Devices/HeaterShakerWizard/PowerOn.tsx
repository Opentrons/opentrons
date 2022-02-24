import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Module,
  RobotWorkSpace,
  SPACING,
  Text,
} from '@opentrons/components'
import { ModuleInfo } from '../../ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'

import type { AttachedModule } from '../../../redux/modules/types'

const VIEW_BOX = '-150 -40 440 128'
interface PowerOnProps {
  attachedModule: AttachedModule | null
}

export function PowerOn(props: PowerOnProps): JSX.Element {
  const { t } = useTranslation('heater_shaker')
  //  TODO(jr, 2022-02-18): change this to heater shaker model when it exists
  const moduleDef = getModuleDef2('magneticModuleV2')

  return (
    <React.Fragment>
      <Flex
        color={COLORS.darkBlack}
        flexDirection={DIRECTION_COLUMN}
        marginBottom="4rem"
        data-testid={`heater_shaker_power_on_text`}
      >
        <Trans
          t={t}
          i18nKey="step_3_power_on"
          components={{
            strong: <Text fontWeight={700} paddingBottom={SPACING.spacingSM} />,
            block: <Text fontSize="1rem" />,
          }}
        />
      </Flex>
      <RobotWorkSpace
        viewBox={VIEW_BOX}
        data-testid={`heater_shaker_svg_and_info`}
      >
        {() => (
          <React.Fragment key={`Power_on_${moduleDef.model}`}>
            <Module
              x={0}
              y={0}
              orientation={inferModuleOrientationFromXCoordinate(0)}
              def={moduleDef}
            >
              <ModuleInfo
                moduleModel={moduleDef.model}
                isAttached={props.attachedModule !== null}
                usbPort={props.attachedModule?.usbPort.port ?? null}
                hubPort={props.attachedModule?.usbPort.hub ?? null}
              />
            </Module>
          </React.Fragment>
        )}
      </RobotWorkSpace>
    </React.Fragment>
  )
}
