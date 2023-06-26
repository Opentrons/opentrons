import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FormikProps } from 'formik'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  Mount,
  ALIGN_CENTER,
  PrimaryButton,
  JUSTIFY_SPACE_BETWEEN,
  LEFT,
  RIGHT,
  InstrumentDiagram,
} from '@opentrons/components'
import {
  PipetteName,
  GEN1,
  GEN2,
  OT2_PIPETTES,
  OT2_ROBOT_TYPE,
  OT3_PIPETTES,
  getAllPipetteNames,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { GoBackLink } from './GoBackLink'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { FormState, WizardTileProps } from './types'

export function FirstPipetteTypeTile(props: WizardTileProps): JSX.Element {
  const mount = LEFT
  return (
    <PipetteTypeTile
      {...props}
      mount={mount}
      allowNoPipette={false}
      tileHeader={i18n.t('modal.create_file_wizard.choose_first_pipette')}
    />
  )
}
export function SecondPipetteTypeTile(
  props: WizardTileProps
): JSX.Element | null {
  if (props.values.pipettesByMount.left.pipetteName === 'p1000_96') {
    props.proceed(2)
    return null
  } else {
    return (
      <PipetteTypeTile
        {...props}
        mount={RIGHT}
        allowNoPipette
        tileHeader={i18n.t('modal.create_file_wizard.choose_second_pipette')}
      />
    )
  }
}
interface PipetteTypeTileProps extends WizardTileProps {
  mount: Mount
  allowNoPipette: boolean
  tileHeader: string
}
export function PipetteTypeTile(props: PipetteTypeTileProps): JSX.Element {
  const { i18n, t } = useTranslation()
  const { allowNoPipette, tileHeader, proceed, goBack } = props
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">{tileHeader}</Text>
          <PipetteField {...props} allowNoPipette={allowNoPipette} />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBackLink onClick={() => goBack()} />
          <PrimaryButton onClick={() => proceed()}>
            {i18n.format(t('shared.next'), 'capitalize')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}

interface OT2FieldProps extends FormikProps<FormState> {
  mount: Mount
  allowNoPipette: boolean
}

function PipetteField(props: OT2FieldProps): JSX.Element {
  const { mount, values, setFieldValue, allowNoPipette } = props
  const robotType = values.fields.robotType
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
    return [
      ...allPipetteOptions.filter(
        //  filter out 96-channel for now
        o => o.name.includes('Flex') && o.value !== 'p1000_96'
      ),
      ...allPipetteOptions.filter(o => o.name.includes(GEN2)),
      ...allPipetteOptions.filter(o => o.name.includes(GEN1)),
      ...(allowNoPipette ? [{ name: 'None', value: '' }] : []),
    ]
  }, [robotType])
  const nameAccessor = `pipettesByMount.${mount}.pipetteName`
  const currentValue = values.pipettesByMount[mount].pipetteName
  React.useEffect(() => {
    if (currentValue === undefined) {
      setFieldValue(
        nameAccessor,
        allowNoPipette ? '' : pipetteOptions[0]?.value ?? ''
      )
    }
  }, [
    currentValue,
    setFieldValue,
    nameAccessor,
    allowNoPipette,
    pipetteOptions,
  ])

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
            setFieldValue(nameAccessor, o.value)
          }}
          width={pipetteOptions.length > 5 ? '14.5rem' : '21.75rem'}
          minHeight="4rem"
        />
      ))}
    </Flex>
  )
}
