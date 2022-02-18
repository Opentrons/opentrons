import React from 'react'
import map from 'lodash/map'
import { useDispatch } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'
import { inferModuleOrientationFromXCoordinate } from '@opentrons/shared-data'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Module,
  RobotWorkSpace,
  SPACING,
  Text,
  useInterval,
} from '@opentrons/components'
import { fetchModules } from '../../../redux/modules'
import { Dispatch } from '../../../redux/types'
import { ModuleInfo } from '../../ProtocolSetup/RunSetupCard/ModuleSetup/ModuleInfo'
import { useModuleRenderInfoById } from '../../ProtocolSetup/hooks'

const POLL_MODULE_INTERVAL_MS = 5000
const VIEW_BOX = '-150 -40 440 128'

interface PowerOnProps {
  robotName: string
}
export function PowerOn(props: PowerOnProps): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('heater_shaker')
  const dispatch = useDispatch<Dispatch>()
  const moduleRenderInfoById = useModuleRenderInfoById()

  useInterval(
    () => dispatch(fetchModules(robotName)),
    robotName === null ? POLL_MODULE_INTERVAL_MS : null,
    true
  )

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
          <>
            {map(moduleRenderInfoById, ({ moduleDef, attachedModuleMatch }) => {
              const { model } = moduleDef
              return (
                <React.Fragment key={`Power_on_${model}`}>
                  {/* TODO(jr, 2022-02-18): change this to heater shaker model when it exists */}
                  {model === 'magneticModuleV2' && (
                    <Module
                      x={0}
                      y={0}
                      orientation={inferModuleOrientationFromXCoordinate(0)}
                      def={moduleDef}
                    >
                      <ModuleInfo
                        moduleModel={model}
                        isAttached={attachedModuleMatch != null}
                        usbPort={attachedModuleMatch?.usbPort.port ?? null}
                        hubPort={attachedModuleMatch?.usbPort.hub ?? null}
                      />
                    </Module>
                  )}
                </React.Fragment>
              )
            })}
          </>
        )}
      </RobotWorkSpace>
    </React.Fragment>
  )
}
