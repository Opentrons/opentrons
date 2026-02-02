import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DropdownMenu,
  RadioButton,
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
import styles from './nozzleandwellwizard.module.css'

import type { Channels, DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
  RobotType,
} from '@opentrons/shared-data'
import type { PipetteShadowProps } from '../TipSelectionWizard/types'

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

interface PipetteNozzleSelectorProps {
  pipetteSpecs: PipetteV2Specs
  robotType: RobotType
  options: DropdownOption[]
  updateValue: (arg: unknown) => void
  value: NozzleConfigurationStyle
  setSelectedValue: any
}

export function PipetteNozzleSelector(
  props: PipetteNozzleSelectorProps
): JSX.Element {
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
    x: -16,
    y: -41.5,
    width: width,
    height: height,
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
      <div className={styles.header_text_wrapper}>
        <StyledText desktopStyle="headingMediumBold">
          {t('select_pipette_nozzles_to_use')}
        </StyledText>
      </div>

      <div className={styles.row_wrapper}>
        <div className={styles.nozzle_selection_text}>
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
        </div>

        <div className={styles.nozzle_background_square}>
          <div
            className={is96Channel ? styles.column_wrapper : styles.row_wrapper}
          >
            <div style={{ height: '100%' }}>
              {!is96Channel && <OutlineComponent {...outlineProps} />}
            </div>

            <div className={styles.column_wrapper}>
              <StyledText desktopStyle="bodyLargeSemiBold">
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
