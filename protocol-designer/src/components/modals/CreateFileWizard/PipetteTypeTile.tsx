import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  Mount,
  ALIGN_CENTER,
  PrimaryButton,
  JUSTIFY_SPACE_BETWEEN,
  InstrumentDiagram,
} from '@opentrons/components'
import {
  PipetteName,
  OT2_PIPETTES,
  OT2_ROBOT_TYPE,
  OT3_PIPETTES,
  getAllPipetteNames,
  getPipetteNameSpecs,
  LEFT,
  RIGHT,
} from '@opentrons/shared-data'

import { GoBack } from './GoBack'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { FormState, WizardTileProps } from './types'
import type { UseFormReturn } from 'react-hook-form'

export function FirstPipetteTypeTile(
  props: Omit<
    PipetteTypeTileProps,
    'mount' | 'allowNoPipette' | 'display96Channel' | 'tileHeader'
  >
): JSX.Element {
  const { t } = useTranslation('modal')
  const mount = LEFT
  return (
    <PipetteTypeTile
      {...props}
      mount={mount}
      allowNoPipette={false}
      display96Channel={true}
      tileHeader={t('choose_left_pipette')}
    />
  )
}
export function SecondPipetteTypeTile(
  props: Omit<
    PipetteTypeTileProps,
    'mount' | 'allowNoPipette' | 'display96Channel' | 'tileHeader'
  >
): JSX.Element | null {
  const { t } = useTranslation('modal')
  const pipettesByMount = props.watch('pipettesByMount')
  if (pipettesByMount.left.pipetteName === 'p1000_96') {
    props.proceed(2)
    return null
  } else {
    return (
      <PipetteTypeTile
        {...props}
        mount={RIGHT}
        allowNoPipette
        display96Channel={false}
        tileHeader={t('choose_right_pipette')}
      />
    )
  }
}
interface PipetteTypeTileProps extends WizardTileProps {
  mount: Mount
  allowNoPipette: boolean
  display96Channel: boolean
  tileHeader: string
}
export function PipetteTypeTile(props: PipetteTypeTileProps): JSX.Element {
  const {
    allowNoPipette,
    display96Channel,
    tileHeader,
    proceed,
    goBack,
  } = props
  const { t } = useTranslation('application')

  return (
    <HandleEnter onEnter={proceed}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing32}
        height="auto"
        overflowY="auto"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">{tileHeader}</Text>
          <PipetteField
            {...props}
            allowNoPipette={allowNoPipette}
            display96Channel={display96Channel}
          />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack onClick={() => goBack()} />
          <PrimaryButton onClick={() => proceed()}>{t('next')}</PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

interface OT2FieldProps extends UseFormReturn<FormState> {
  mount: Mount
  allowNoPipette: boolean
  display96Channel: boolean
}

function PipetteField(props: OT2FieldProps): JSX.Element {
  const { mount, watch, allowNoPipette, setValue, display96Channel } = props
  const robotType = watch('fields.robotType')
  const pipettesByMount = watch('pipettesByMount')
  const pipetteOptions = React.useMemo(() => {
    const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
      .filter(name =>
        (robotType === OT2_ROBOT_TYPE ? OT2_PIPETTES : OT3_PIPETTES).includes(
          name
        )
      )
      .map(name => ({
        value: name,
        name: getPipetteNameSpecs(name)?.displayName ?? '',
      }))
    const noneOption = allowNoPipette ? [{ name: 'None', value: '' }] : []
    return display96Channel
      ? [...allPipetteOptions, ...noneOption]
      : [
          ...allPipetteOptions.filter(o => o.value !== 'p1000_96'),
          ...noneOption,
        ]
  }, [robotType])

  const currentValue = pipettesByMount[mount].pipetteName
  React.useEffect(() => {
    if (currentValue === undefined) {
      setValue(
        `pipettesByMount.${mount}.pipetteName`,
        allowNoPipette ? '' : pipetteOptions[0]?.value ?? ''
      )
    }
  }, [])

  return (
    <Flex
      flexWrap="wrap"
      gridGap={SPACING.spacing4}
      alignSelf={ALIGN_CENTER}
      overflowY="scroll"
    >
      {pipetteOptions.map(o => (
        <EquipmentOption
          key={o.name}
          isSelected={currentValue === o.value}
          image={
            o.value === '' ? null : (
              <InstrumentDiagram
                mount="left"
                imageStyle={css`
                  max-height: 3rem;
                `}
                pipetteSpecs={getPipetteNameSpecs(o.value as PipetteName)}
              />
            )
          }
          text={o.name}
          onClick={() => {
            setValue(`pipettesByMount.${mount}.pipetteName`, o.value)
          }}
          width={pipetteOptions.length > 5 ? '14.5rem' : '21.75rem'}
          minHeight="4rem"
        />
      ))}
    </Flex>
  )
}
