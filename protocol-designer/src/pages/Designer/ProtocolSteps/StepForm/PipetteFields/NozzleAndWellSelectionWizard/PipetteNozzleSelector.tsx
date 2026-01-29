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

import { EightChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/EightChannelFlexShadow'
import { EightChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/EightChannelOT2Shadow'
import { NinetySixChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/NinetySixChannelFlexShadow'
import { SingleChannelOT2Shadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelOT2Shadow'
import { SingleChannelFlexShadow } from '../TipSelectionWizard/PipetteShadows/SingleChannelShadow'

import type { Channels, DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
  RobotType,
} from '@opentrons/shared-data'
import type { PipetteShadowProps } from '../TipSelectionWizard/types'
import { PipetteShadow } from '../TipSelectionWizard/PipetteShadows/PipetteShadow'

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
  value: NozzleConfigurationStyle
  setSelectedValue: any
}): JSX.Element {
  const {
    pipetteSpecs,
    robotType,
    options,
    updateValue,
    value: nozzleMode,
    setSelectedValue,
  } = props
  const { channels, pipetteBoundingBoxOffsets, displayName } = pipetteSpecs
  const { backLeftCorner, frontRightCorner } = pipetteBoundingBoxOffsets
  const { t } = useTranslation('protocol_steps')

  const [partialNozzleCount, setPartialNozzleCount] = useState<string>('2')

  const width = frontRightCorner[0] - backLeftCorner[0]
  const height = backLeftCorner[1] - frontRightCorner[1]

  const outlineProps = {
    fill: COLORS.white,
    stroke: COLORS.grey50,
    x: 0,
    y: 0,
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

  const OutlineComponent =
    SHADOW_BY_ROBOT_TYPE_AND_CHANNELS[robotType][channels]
  const isPartialNozzle = nozzleMode === PARTIAL
  return (
    <>
      <Flex padding={SPACING.spacing20}>
        <StyledText desktopStyle="headingMediumBold">
          {t('select_pipette_nozzles_to_use')}
        </StyledText>
      </Flex>

      <Flex flexDirection={DIRECTION_ROW}>
        <Flex
          gridGap={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing12}
        >
          {options.map(({ value, name }) => {
            return (
              <RadioButton
                key={`${name}_${value}`}
                buttonLabel={name}
                buttonValue={value}
                isSelected={nozzleMode === value}
                onChange={() => {
                  updateValue(value)
                  setSelectedValue(value)
                }}
                largeDesktopBorderRadius
              />
            )
          })}
        </Flex>

        <Box
          backgroundColor={COLORS.grey20}
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
             <Flex maxHeight={"10px"}>
            {!is96Channel && <EightChannelFlexShadow{...outlineProps}/>}
</Flex>

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
                  onClick={value => {
                    setPartialNozzleCount(value)
                  }}
                  currentOption={
                    partialOptions.find(
                      option => option.value === partialNozzleCount
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
