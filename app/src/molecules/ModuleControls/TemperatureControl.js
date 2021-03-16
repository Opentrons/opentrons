// @flow
import * as React from 'react'
import { css } from 'styled-components'

import {
  AlertModal,
  InputField,
  SecondaryBtn,
  useHoverTooltip,
  Tooltip,
  SPACING_3,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  Flex,
  Box,
  DIRECTION_COLUMN,
  FONT_STYLE_ITALIC,
  FONT_SIZE_BODY_1,
} from '@opentrons/components'
import { Portal } from '../../App/portal'

import type {
  ThermocyclerModule,
  TemperatureModule,
  ModuleCommand,
} from '../../redux/modules/types'
import { THERMOCYCLER_MODULE_TYPE } from '../../redux/modules'
import { getModuleDisplayName } from '@opentrons/shared-data'

const TC_BLOCK = 'Block'

type Props = {|
  module: ThermocyclerModule | TemperatureModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  disabledReason?: string | null,
|}

export const TemperatureControl = ({
  module,
  sendModuleCommand,
  disabledReason,
}: Props): React.Node => {
  const [primaryTempValue, setPrimaryTempValue] = React.useState(null)
  const [secondaryTempValue, setSecondaryTempValue] = React.useState(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isSecondaryTempEnabled, enableSecondaryTemp] = React.useState(false)

  const [targetProps, tooltipProps] = useHoverTooltip()

  const isThermocycler = module.type === THERMOCYCLER_MODULE_TYPE
  const displayName = getModuleDisplayName(module.model)
  const alertHeading = `Set ${displayName} Temp`
  const alertBody = `Pre heat or cool your ${displayName}.`
  const primaryFieldLabel = `Set ${isThermocycler ? TC_BLOCK : ''} Temp:`
  const tempRanges = getModuleTemperatureRanges(
    module.model,
    isSecondaryTempEnabled
  )
  const note = `enter a whole-number between ${tempRanges.min}°C and ${tempRanges.max}°C`

  const hasTarget = module.status !== 'idle'
  const hasSecondaryTarget =
    module.type === THERMOCYCLER_MODULE_TYPE && module.data.lidTarget != null

  const handleClick = () => {
    if (hasTarget) {
      sendModuleCommand(module.serial, 'deactivate')
    } else {
      enableSecondaryTemp(false)
      setIsModalOpen(true)
    }
  }

  const handleSecondaryClick = () => {
    if (isThermocycler && module.data.lidTarget != null) {
      sendModuleCommand(module.serial, 'deactivate_lid')
    } else {
      enableSecondaryTemp(true)
      setIsModalOpen(true)
    }
  }

  const handleSubmitTemp = () => {
    if (primaryTempValue != null) {
      sendModuleCommand(module.serial, 'set_temperature', [
        Number(primaryTempValue),
      ])
    }
    if (secondaryTempValue != null) {
      sendModuleCommand(module.serial, 'set_lid_temperature', [
        Number(secondaryTempValue),
      ])
    }
    setPrimaryTempValue(null)
    setSecondaryTempValue(null)
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setPrimaryTempValue(null)
    setSecondaryTempValue(null)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {!hasTarget && isModalOpen && (
        <Portal>
          <AlertModal
            heading={alertHeading}
            iconName={null}
            buttons={[
              {
                children: 'Cancel',
                onClick: handleCancel,
              },
              {
                children: 'Set temp',
                disabled: isSecondaryTempEnabled
                  ? secondaryTempValue == null
                  : primaryTempValue == null,
                onClick: handleSubmitTemp,
              },
            ]}
            alertOverlay
          >
            <Text>{alertBody}</Text>
            <Box>
              <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>{primaryFieldLabel}</Text>
              <Flex width="6rem" marginTop={SPACING_1}>
                <InputField
                  units="°C"
                  value={
                    isSecondaryTempEnabled
                      ? secondaryTempValue
                      : primaryTempValue
                  }
                  onChange={e =>
                    isSecondaryTempEnabled
                      ? setSecondaryTempValue(e.target.value)
                      : setPrimaryTempValue(e.target.value)
                  }
                />
              </Flex>
              <Text
                fontSize={FONT_SIZE_BODY_1}
                fontStyle={FONT_STYLE_ITALIC}
                marginTop={SPACING_1}
              >
                {note}
              </Text>
            </Box>
          </AlertModal>
        </Portal>
      )}
      {isThermocycler && (
        <>
          <SecondaryBtn
            width="11rem"
            marginBottom={SPACING_3}
            onClick={handleSecondaryClick}
            disabled={disabledReason != null}
            {...targetProps}
          >
            {hasSecondaryTarget === true ? 'Deactivate Lid' : 'Set Lid Temp'}
          </SecondaryBtn>
          {disabledReason && (
            <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
          )}
        </>
      )}
      <SecondaryBtn
        css={css`
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        `}
        width="11rem"
        onClick={handleClick}
        disabled={disabledReason != null}
        {...targetProps}
      >
        {hasTarget === true
          ? `Deactivate ${isThermocycler ? 'block ' : ''}`
          : `Set ${isThermocycler ? 'block ' : ''}Temp`}
      </SecondaryBtn>
      {disabledReason && <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>}
    </Flex>
  )
}

type temperatureRanges = {|
  min: number,
  max: number,
|}

function getModuleTemperatureRanges(
  model: ModuleModel,
  isSecondaryTempEnabled: boolean
) {
  if (isSecondaryTempEnabled && TEMPERATURE_RANGES[model].secondary) {
    return TEMPERATURE_RANGES[model].secondary
  } else {
    return TEMPERATURE_RANGES[model].primary
  }
}

const TEMPERATURE_RANGES: {
  [ModuleModel]: {
    primary: temperatureRanges,
    secondary?: temperatureRanges | null,
  },
} = {
  temperatureModuleV1: { primary: { min: 4, max: 96 }, secondary: null },
  temperatureModuleV2: { primary: { min: 4, max: 96 }, secondary: null },
  thermocyclerModuleV1: {
    primary: { min: 4, max: 99 },
    secondary: { min: 37, max: 110 },
  },
}
