import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormikProps } from 'formik'
import reduce from 'lodash/reduce'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  Mount,
  RadioOption,
  ALIGN_CENTER,
  PrimaryButton,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { GoBackLink } from './GoBackLink'
import { EquipmentOption } from './EquipmentOption'
import { HandleEnter } from './HandleEnter'

import type { PipetteName } from '@opentrons/shared-data'
import type { FormState, WizardTileProps } from './types'

export function FirstPipetteTipsTile(props: WizardTileProps): JSX.Element {
  return <PipetteTipsTile {...props} mount="left" />
}
export function SecondPipetteTipsTile(
  props: WizardTileProps
): JSX.Element | null {
  if (props.values.pipettesByMount.left.pipetteName === 'p1000_96') {
    props.proceed()
    return null
  } else if (props.values.pipettesByMount.right.pipetteName === '') {
    props.proceed()
    return null
  } else {
    return <PipetteTipsTile {...props} mount="right" />
  }
}
interface PipetteTipsTileProps extends WizardTileProps {
  mount: Mount
}
export function PipetteTipsTile(props: PipetteTipsTileProps): JSX.Element {
  const { i18n, t } = useTranslation()
  const { proceed, goBack, mount, values } = props

  const firstPipetteName = values.pipettesByMount[mount].pipetteName
  const tileHeader = i18n.t(
    'modal.create_file_wizard.choose_tips_for_pipette',
    {
      pipetteName:
        firstPipetteName != null
          ? getPipetteNameSpecs(firstPipetteName as PipetteName)?.displayName ??
            ''
          : '',
      mount,
    }
  )
  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          height="26rem"
          gridGap={SPACING.spacing32}
        >
          <Text as="h2">{tileHeader}</Text>
          <PipetteTipsField {...props} />
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

interface PipetteTipsFieldProps extends FormikProps<FormState> {
  mount: Mount
}

function PipetteTipsField(props: PipetteTipsFieldProps): JSX.Element | null {
  const { mount, values, setFieldValue } = props
  const allLabware = useSelector(getLabwareDefsByURI)
  const selectedPipetteName = values.pipettesByMount[mount].pipetteName
  const selectedPipetteDefaultTipRacks =
    selectedPipetteName != null
      ? getPipetteNameSpecs(selectedPipetteName as PipetteName)
          ?.defaultTipracks ?? []
      : []

  const tipRackOptions = reduce<typeof allLabware, RadioOption[]>(
    allLabware,
    (acc, def: typeof allLabware[string]) => {
      if (
        def.metadata.displayCategory !== 'tipRack' ||
        !selectedPipetteDefaultTipRacks.includes(getLabwareDefURI(def))
      )
        return acc
      return [
        ...acc,
        {
          name: getLabwareDisplayName(def),
          value: getLabwareDefURI(def),
        },
      ]
    },
    []
  ).sort(a => (a.name.includes('(Retired)') ? 1 : -1))
  const nameAccessor = `pipettesByMount.${mount}.tiprackDefURI`
  const currentValue = values.pipettesByMount[mount].tiprackDefURI
  if (currentValue === undefined) {
    setFieldValue(nameAccessor, tipRackOptions[0]?.value ?? '')
  }

  return (
    <Flex flexWrap="wrap" gridGap={SPACING.spacing4} alignSelf={ALIGN_CENTER}>
      {tipRackOptions.map(o => (
        <EquipmentOption
          key={o.name}
          isSelected={currentValue === o.value}
          text={o.name}
          onClick={() => {
            setFieldValue(nameAccessor, o.value)
          }}
          width="21.75rem"
          minHeight="4rem"
        />
      ))}
    </Flex>
  )
}
