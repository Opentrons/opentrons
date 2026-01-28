import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DropdownMenu,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  PARTIAL,
} from '@opentrons/shared-data'

import { EightChannelFlexShadow } from './EightChannelFlexShadow'
import { EightChannelOT2Shadow } from './EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from './NinetySixChannelFlexShadow'
import { SingleChannelOT2Shadow } from './SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from './SingleChannelShadow'

import type { Channels, DropdownOption } from '@opentrons/components'
import type { PipetteV2Specs, RobotType } from '@opentrons/shared-data'
import type { PipetteShadowProps } from '../types'

const SHADOW_BY_ROBOT_TYPE_AND_CHANNELS: Record<
  RobotType,
  Record<Channels, (props: PipetteShadowProps) => JSX.Element>
> = {
  [OT2_ROBOT_TYPE]: {
    1: SingleChannelOT2Shadow,
    8: EightChannelOT2Shadow,
    96: () => {
      console.warn('96-channel not supported on OT-2')
      return <></>
    },
  },
  [FLEX_ROBOT_TYPE]: {
    1: SingleChannelFlexShadow,
    8: EightChannelFlexShadow,
    96: NinetySixChannelFlexShadow,
  },
}

export function PipetteNozzleSelector(props: {
  pipetteSpecs: PipetteV2Specs
  robotType: RobotType
  options: DropdownOption[]
  updateValue: (arg: unknown) => void
}): JSX.Element {
  const { pipetteSpecs, robotType, options, updateValue } = props
  console.log('🚀 ~ PipetteNozzleSelector ~ options:', options)
  const { channels, pipetteBoundingBoxOffsets, displayName } = pipetteSpecs
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const { t } = useTranslation('protocol_steps')

  const [selectedValue, setSelectedValue] = useState<string | null>(null)

  const width = frontRightCorner[0] - backLeftCorner[0]
  const height = backLeftCorner[1] - frontRightCorner[1]

  const outlineProps = {
    fill: COLORS.white,
    stroke: COLORS.grey50,
    x: -80,
    y: -55,
    width: width * 3,
    height: height * 3,
    rotate: false,
  }

  const is96Channel = channels === 96

  const nozzles = Array.from({ length: 6 }, (_, i) => String(i + 2))

  const partialOptions: DropdownOption[] = nozzles.map(num => ({
    name: t('num_nozzles', { num }),
    value: num,
  }))
  console.log('options', options)
  const OutlineComponent =
    SHADOW_BY_ROBOT_TYPE_AND_CHANNELS[robotType][channels]
  const isPartialNozzle = false
  return (
    <>
      <StyledText desktopStyle="headingMediumBold">
        {t('select_pipette_nozzles_to_use')}
      </StyledText>

      <Flex flexDirection={DIRECTION_ROW} padding={SPACING.spacing12}>
        <Flex
          gridGap={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing12}
        >
          {options.map(({ value, name }) => (
            <RadioButton
              key={`${name}_${value}`}
              buttonLabel={name}
              buttonValue={value}
              isSelected={selectedValue === value}
              onChange={() => {
                setSelectedValue(value)
                updateValue(value)
              }}
              largeDesktopBorderRadius
            />
          ))}
        </Flex>

        <Box
          backgroundColor={COLORS.grey20}
          padding={SPACING.spacing20}
          borderRadius={BORDERS.borderRadius12}
          width="558px"
          height="497px"
        >
          <Flex
            flexDirection={is96Channel ? DIRECTION_COLUMN : DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            padding={SPACING.spacing20}
            gridGap={SPACING.spacing10}
          >
            {!is96Channel && <OutlineComponent {...outlineProps} />}

            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {displayName}
              </StyledText>

              {is96Channel && <OutlineComponent {...outlineProps} />}

              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={isPartialNozzle ? COLORS.grey60 : COLORS.black90}
              >
                {isPartialNozzle
                  ? t('number_of_nozzles_used')
                  : t('click_on_highlighted_nozzles')}
              </StyledText>

              {isPartialNozzle && (
                <DropdownMenu
                  dropdownType="neutral"
                  filterOptions={partialOptions}
                  onClick={option => {
                    setSelectedValue(option.valueOf)
                    updateValue(option.valueOf)
                  }}
                  currentOption={
                    partialOptions.find(
                      option => option.value === selectedValue
                    ) ?? partialOptions[0]
                  }
                />
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </>
  )
}
