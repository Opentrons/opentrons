import * as React from 'react'
import { css } from 'styled-components'
import reduce from 'lodash/reduce'
import { DIRECTION_COLUMN, Flex, Text, SPACING, RadioGroup, Mount, RadioOption } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FormikProps } from 'formik'

import type { FormState } from './types'
import { GEN1, GEN2, OT2_PIPETTES, OT2_ROBOT_TYPE, OT3_PIPETTES, getAllPipetteNames, getLabwareDefURI, getLabwareDisplayName, getPipetteNameSpecs } from '@opentrons/shared-data'
import { useSelector } from 'react-redux'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import type { PipetteName } from '@opentrons/shared-data'
import { linkPSemiBold } from '@opentrons/components/src/ui-style-constants/typography'

export function FirstPipetteTile(props: FormikProps<FormState>): JSX.Element {
  return (
    <PipetteTile
      {...props}
      mount="left"
      allowNoPipette={false}
      tileHeader={i18n.t('modal.create_file_wizard.choose_first_pipette')} />
  )
}
export function SecondPipetteTile(props: FormikProps<FormState>): JSX.Element {
  return (
    <PipetteTile
      {...props}
      mount="right"
      allowNoPipette
      tileHeader={i18n.t('modal.create_file_wizard.choose_second_pipette')} />
  )
}
interface PipetteTileProps extends FormikProps<FormState> {
  mount: Mount
  allowNoPipette: boolean
  tileHeader: string
}
export function PipetteTile(props: PipetteTileProps): JSX.Element {
  const { allowNoPipette, tileHeader } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} height='26rem' gridGap={SPACING.spacing32}>
      <Text as='h2'>{tileHeader}</Text>
      <Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16} flex="1">
          <Text as='p'>{i18n.t('modal.create_file_wizard.pipette_type')}</Text>
          <PipetteField {...props} allowNoPipette={allowNoPipette} />
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16} flex="1">
          <Text as='p'>
            {i18n.t('modal.create_file_wizard.choose_at_least_one_tip_rack')}
          </Text>
          <OT2TipRackField {...props} />
        </Flex>
      </Flex>
    </Flex>
  )
}

interface OT2FieldProps extends FormikProps<FormState> {
  mount: Mount,
  allowNoPipette: boolean
}

function PipetteField(props: OT2FieldProps): JSX.Element {
  const { mount, values, setFieldValue, allowNoPipette } = props
  const robotType = values.fields.robotType
  const pipetteOptions = React.useMemo(() => {
    const allPipetteOptions = getAllPipetteNames('maxVolume', 'channels')
      .filter(name => (robotType === OT2_ROBOT_TYPE ? OT2_PIPETTES : OT3_PIPETTES).includes(name))
      .map(name => ({
        value: name,
        name: getPipetteNameSpecs(name)?.displayName ?? ''
      }))
    return [
      ...(allowNoPipette ? [{ name: 'None', value: '' }] : []),
      ...allPipetteOptions.filter(o => o.name.includes('Flex')),
      ...allPipetteOptions.filter(o => o.name.includes(GEN2)),
      ...allPipetteOptions.filter(o => o.name.includes(GEN1))
    ]
  }, [robotType])

  const nameAccessor = `pipettesByMount.${mount}.pipetteName`

  return (
    <RadioGroup
      options={pipetteOptions}
      value={values.pipettesByMount[mount].pipetteName ?? ''}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        setFieldValue(nameAccessor, e.currentTarget.value)
      }}
      name={nameAccessor}
    />
  )
}

const OT2_TIP_VOLS_FOR_PIP_VOL: { [maxVol: number]: number[] } = {
  10: [10],
  20: [10, 20],
  50: [200, 300],
  300: [200, 300],
  1000: [1000]
}

const FLEX_TIP_VOLS_FOR_PIP_VOL: { [maxVol: number]: number[] } = {
  50: [50, 200],
  1000: [1000]
}

function OT2TipRackField(props: OT2FieldProps): JSX.Element {
  const { mount, setFieldValue, values } = props
  const allLabware = useSelector(getLabwareDefsByURI)
  const [showAll, setShowAll] = React.useState(false)

  let tipRackOptions = reduce<typeof allLabware, RadioOption[]>(
    allLabware,
    (acc, def: typeof allLabware[string]) => {
      if (def.metadata.displayCategory !== 'tipRack') return acc
      return [
        ...acc,
        {
          name: getLabwareDisplayName(def),
          value: getLabwareDefURI(def),
        },
      ]
    },
    []
  ).sort(a => a.name.includes('(Retired)') ? 1 : -1)

  const robotType = values.fields.robotType
  const selectedPipetteName = values.pipettesByMount[mount].pipetteName
  const selectedPipetteMaxVol = selectedPipetteName != null ? getPipetteNameSpecs(selectedPipetteName as PipetteName)?.maxVolume ?? 0 : 0

  if (!showAll) {
    tipRackOptions = tipRackOptions.filter(o => !o.name.includes('(Retired)'))
    if (selectedPipetteMaxVol > 0) {
      tipRackOptions = tipRackOptions.filter(o => (
        (robotType === OT2_ROBOT_TYPE ? OT2_TIP_VOLS_FOR_PIP_VOL : FLEX_TIP_VOLS_FOR_PIP_VOL)[selectedPipetteMaxVol].some(vol => (
          o.name.includes(`${String(vol)} `)
        ))
      ))
    }
  }

  const nameAccessor = `pipettesByMount.${mount}.tiprackDefURI`

  return (
    <>
      <RadioGroup
        options={tipRackOptions}
        value={values.pipettesByMount[mount].tiprackDefURI ?? ''}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          setFieldValue(nameAccessor, e.currentTarget.value)
        }}
        name={nameAccessor}
      />
      <Text
        as="p"
        onClick={() => setShowAll(!showAll)}
        css={css`
          ${linkPSemiBold}
          cursor: pointer;
        `}>
        {showAll ? 'Show Less' : 'Show More'}
      </Text>
    </>
  )

}