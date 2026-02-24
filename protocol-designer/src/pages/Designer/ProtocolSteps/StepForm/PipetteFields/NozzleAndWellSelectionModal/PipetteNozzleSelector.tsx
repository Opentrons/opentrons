import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DropdownMenu,
  RadioButton,
  StyledText,
} from '@opentrons/components'
import { A1_NOZZLE, ALL, G1_NOZZLE, PARTIAL } from '@opentrons/shared-data'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import styles from './nozzleandwellwizard.module.css'
import { NozzleRender } from './NozzleRender'
import {
  getAvailableNozzleConfigurations,
  getEntireWellSelection,
  partialNozzleMap,
} from './utils'

import type { TFunction } from 'i18next'
import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { FieldPropsByName } from '../../types'

interface PipetteNozzleSelectorProps {
  pipetteSpecs: PipetteV2Specs
  robotType: RobotType
  propsForFields: FieldPropsByName
}

export function PipetteNozzleSelector(
  props: PipetteNozzleSelectorProps
): JSX.Element {
  const { pipetteSpecs, propsForFields, robotType } = props
  const { channels, displayName } = pipetteSpecs
  const { t } = useTranslation('protocol_steps')

  const nozzleConfiguration = propsForFields.nozzles
    .value as NozzleConfigurationStyle
  const primaryNozzle = (propsForFields.primaryNozzle?.value ??
    A1_NOZZLE) as PrimaryNozzleConfigurationStyle
  const deckSetup = useSelector(getInitialDeckSetup)
  const is96Channel = channels === 96

  const nozzleConfigurationOptions = getAvailableNozzleConfigurations(
    channels,
    deckSetup,
    t as TFunction
  )

  const partialOptions: DropdownOption[] = Object.entries(partialNozzleMap).map(
    ([nozzle, num]) => ({
      name: t('num_nozzles', { num }),
      value: nozzle as PartialPrimaryNozzles,
    })
  )

  const wellOrdering = Object.values(pipetteSpecs.orderedColumns).map(
    column => column.orderedNozzles
  )

  const isPartialNozzle = nozzleConfiguration === PARTIAL

  const [selectedNozzle, setSelectedNozzle] = useState<string[]>([])

  // Recompute selected nozzles whenever nozzle config or primary nozzle changes
  useEffect(() => {
    let updatedNozzles: string[]
    if (!isPartialNozzle) {
      updatedNozzles = getEntireWellSelection(
        primaryNozzle,
        wellOrdering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
    } else {
      const numNozzles =
        partialNozzleMap[
          propsForFields.primaryNozzle.value as PartialPrimaryNozzles
        ]
      const col = wellOrdering[0]
      updatedNozzles = col.slice(col.length - numNozzles, col.length)
    }
    setSelectedNozzle(updatedNozzles)
  }, [
    primaryNozzle,
    nozzleConfiguration,
    channels,
    wellOrdering,
    isPartialNozzle,
    propsForFields.primaryNozzle.value,
  ])

  let subText = ''

  if (isPartialNozzle) {
    subText = t('number_of_nozzles_used')
  } else if (nozzleConfiguration !== ALL) {
    subText = t('click_on_highlighted_nozzles')
  }
  return (
    <>
      <div className={styles.header_text_wrapper}>
        <StyledText desktopStyle="headingMediumBold">
          {t('select_pipette_nozzles_to_use')}
        </StyledText>
      </div>
      <div className={styles.row_wrapper}>
        <div className={styles.nozzle_selection_text}>
          {nozzleConfigurationOptions.map(({ value, name }) => (
            <RadioButton
              key={`${name}_${value}`}
              buttonLabel={name}
              buttonValue={value}
              isSelected={nozzleConfiguration === value}
              onChange={() => {
                propsForFields.nozzles.updateValue(value)
                propsForFields.primaryNozzle.updateValue(
                  value === PARTIAL ? G1_NOZZLE : null
                )
                setSelectedNozzle([])
              }}
              largeDesktopBorderRadius
            />
          ))}
        </div>
        <div className={styles.nozzle_background_square}>
          <div
            className={is96Channel ? styles.column_wrapper : styles.row_wrapper}
          >
            {!is96Channel && (
              <NozzleRender
                setSelectedNozzle={setSelectedNozzle}
                selectedNozzle={selectedNozzle}
                robotType={robotType}
                pipetteSpecs={pipetteSpecs}
                propsForFields={propsForFields}
              />
            )}

            <div
              className={
                is96Channel
                  ? styles.column_wrapper
                  : styles.column_wrapper_fixed_width
              }
            >
              <StyledText
                desktopStyle="bodyLargeSemiBold"
                color={COLORS.black90}
              >
                {displayName}
              </StyledText>
              {is96Channel && (
                <NozzleRender
                  setSelectedNozzle={setSelectedNozzle}
                  selectedNozzle={selectedNozzle}
                  robotType={robotType}
                  pipetteSpecs={pipetteSpecs}
                  propsForFields={propsForFields}
                />
              )}
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={isPartialNozzle ? COLORS.grey60 : COLORS.black90}
              >
                {subText}
              </StyledText>
              {isPartialNozzle && (
                <DropdownMenu
                  key="partialTipDropDown"
                  dropdownType="neutral"
                  filterOptions={partialOptions}
                  onClick={value => {
                    propsForFields.primaryNozzle.updateValue(value)
                  }}
                  currentOption={
                    partialOptions.find(
                      option => option.value === primaryNozzle
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
