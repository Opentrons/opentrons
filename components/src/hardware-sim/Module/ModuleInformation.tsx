import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  MAGNETIC_BLOCK_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { Icon } from '../../icons'
import { RobotCoordsForeignObject } from '../../hardware-sim/Deck'
import { Flex, Text } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
} from '../../styles'
import { COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type { ModuleDefinition } from '@opentrons/shared-data'

// TODO(bh, 2023-10-16): deck map design updates ongoing, this component may change or be removed
export interface ModuleInformationProps {
  moduleDef: ModuleDefinition
  isAttached: boolean
  port?: number
}

/**
 * a component library version of module information intended to be rendered as a child of Module
 */
export const ModuleInformation = (
  props: ModuleInformationProps
): JSX.Element => {
  const { moduleDef, port, isAttached } = props
  const {
    xDimension,
    yDimension,
    labwareInterfaceYDimension,
    labwareInterfaceXDimension,
  } = moduleDef.dimensions
  const { t } = useTranslation('protocol_setup')

  let connectionStatus = t('no_usb_port_yet')
  if (moduleDef.moduleType === MAGNETIC_BLOCK_TYPE) {
    connectionStatus = t('no_usb_required')
  }
  if (port == null && isAttached) {
    connectionStatus = t('usb_connected_no_port_info')
  } else if (port != null && isAttached) {
    connectionStatus = t('usb_port_connected', { port })
  }

  return (
    <RobotCoordsForeignObject
      x={0}
      y={0}
      height={labwareInterfaceYDimension ?? yDimension}
      width={labwareInterfaceXDimension ?? xDimension}
      flexProps={{
        padding: SPACING.spacing16,
        backgroundColor:
          moduleDef.moduleType === THERMOCYCLER_MODULE_TYPE
            ? COLORS.white
            : COLORS.transparent,
      }}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing2}
        justifyContent={JUSTIFY_CENTER}
      >
        {moduleDef.moduleType !== MAGNETIC_BLOCK_TYPE ? (
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <Icon
              name={isAttached ? 'ot-check' : 'alert-circle'}
              color={isAttached ? COLORS.successEnabled : COLORS.warningEnabled}
              key="icon"
              size="10px"
              marginRight={SPACING.spacing4}
            />

            <Text
              color={COLORS.darkGreyEnabled}
              fontSize={TYPOGRAPHY.fontSizeCaption}
            >
              {!isAttached ? t('module_not_connected') : t('module_connected')}
            </Text>
          </Flex>
        ) : null}
        <Text
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkGreyEnabled}
          fontSize={TYPOGRAPHY.fontSizeLabel}
        >
          {moduleDef.displayName}
        </Text>
        <Text color={COLORS.darkGreyEnabled} fontSize={TYPOGRAPHY.fontSizeH6}>
          {connectionStatus}
        </Text>
      </Flex>
    </RobotCoordsForeignObject>
  )
}
