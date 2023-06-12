import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import reduce from 'lodash/reduce'
import { DIRECTION_COLUMN, Flex, Text, SPACING, RadioGroup, Mount, RadioOption, ALIGN_CENTER, PrimaryButton, SecondaryButton, JUSTIFY_SPACE_BETWEEN } from '@opentrons/components'
import { i18n } from '../../../localization'
import { FormikProps } from 'formik'

import type { FormState, WizardTileProps } from './types'
import { GEN1, GEN2, OT2_PIPETTES, OT2_ROBOT_TYPE, OT3_PIPETTES, getAllPipetteNames, getLabwareDefURI, getLabwareDisplayName, getPipetteNameSpecs } from '@opentrons/shared-data'
import { useSelector } from 'react-redux'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import type { PipetteName } from '@opentrons/shared-data'
import { linkPSemiBold } from '@opentrons/components/src/ui-style-constants/typography'
import { GoBackLink } from './GoBackLink'

export function FirstPipetteTile(props: WizardTileProps): JSX.Element {
  return (
    <PipetteTile
      {...props}
      mount="left"
      allowNoPipette={false}
      tileHeader={i18n.t('modal.create_file_wizard.choose_first_pipette')} />
  )
}
export function SecondPipetteTile(props: WizardTileProps): JSX.Element {
  return (
    <PipetteTile
      {...props}
      mount="right"
      allowNoPipette
      tileHeader={i18n.t('modal.create_file_wizard.choose_second_pipette')} />
  )
}
interface PipetteTileProps extends WizardTileProps {
  mount: Mount
  allowNoPipette: boolean
  tileHeader: string
}
export function PipetteTile(props: PipetteTileProps): JSX.Element {
  const { i18n, t } = useTranslation()
  const { allowNoPipette, tileHeader, proceed, goBack } = props
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
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
      <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <GoBackLink onClick={goBack}/>
        <PrimaryButton onClick={proceed}>{i18n.format(t('shared.next'), 'capitalize')}</PrimaryButton>
      </Flex>
    </Flex>
  )
}

interface OT2FieldProps extends FormikProps<FormState> {
  mount: Mount,
  allowNoPipette: boolean
}

function PipetteField(props: OT2FieldProps): JSX.Element {
  const { mount, values, setFieldValue, allowNoPipette, handleChange } = props
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
  // const selectedPipetteName = values.pipettesByMount[mount].pipetteName
  // React.useEffect(() => {
  //   if (selectedPipetteName === undefined) {
  //     setFieldValue(nameAccessor, pipetteOptions[0].value)
  //   }
  // }, [selectedPipetteName])
  return (
    <RadioGroup
      options={pipetteOptions}
      value={values.pipettesByMount[mount].pipetteName ?? ''}
      onChange={(e) => {
        handleChange(e)
        setFieldValue(`pipettesByMount.${mount}.tiprackDefURI`, undefined)
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
  const { mount, setFieldValue, values, handleChange } = props
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

  const selectedTipRack = values.pipettesByMount[mount].tiprackDefURI
  const nameAccessor = `pipettesByMount.${mount}.tiprackDefURI`

  // React.useEffect(() => {
  //   if (selectedTipRack === undefined) {
  //     setFieldValue(nameAccessor, tipRackOptions[0].value)
  //   }
  // }, [selectedTipRack, selectedPipetteName])

  return selectedPipetteName !== '' ? (
    <>
      <RadioGroup
        options={tipRackOptions}
        value={selectedTipRack ?? ''}
        onChange={handleChange}
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
  ) : <Text as="p">N/A</Text>

}