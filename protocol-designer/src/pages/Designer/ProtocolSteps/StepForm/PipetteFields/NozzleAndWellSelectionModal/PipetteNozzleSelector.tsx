import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DropdownMenu,
  RadioButton,
  StyledText,
} from '@opentrons/components'
import { A1_NOZZLE, PARTIAL } from '@opentrons/shared-data'

import styles from './nozzleandwellwizard.module.css'
import { NozzleRender } from './NozzleRender'

import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
  RobotType,
} from '@opentrons/shared-data'

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
  const { channels, displayName } = pipetteSpecs
  const { t } = useTranslation('protocol_steps')

  const [partialNozzleCount, setPartialNozzleCount] = useState<string>('2')
  const is96Channel = channels === 96
  const nozzles = Array.from({ length: 6 }, (_, i) => String(i + 2))

  const partialOptions: DropdownOption[] = nozzles.map(num => ({
    name: t('num_nozzles', { num }),
    value: num,
  }))

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
              {!is96Channel && (
                <NozzleRender
                  robotType={robotType}
                  pipetteSpecs={pipetteSpecs}
                  nozzleConfiguration={nozzleMode}
                  primaryNozzle={A1_NOZZLE}
                />
              )}
            </div>
            <div className={styles.column_wrapper}>
              <StyledText desktopStyle="bodyLargeSemiBold">
                {displayName}
              </StyledText>
              {is96Channel && (
                <NozzleRender
                  robotType={robotType}
                  pipetteSpecs={pipetteSpecs}
                  nozzleConfiguration={nozzleMode}
                  primaryNozzle={A1_NOZZLE}
                />
              )}
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
