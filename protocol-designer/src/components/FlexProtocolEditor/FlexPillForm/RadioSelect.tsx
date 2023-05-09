import * as React from 'react'
import groupBy from 'lodash/groupBy'
import {
  getAllPipetteNames,
  getPipetteNameSpecs,
  GEN1,
  GEN3,
} from '@opentrons/shared-data'
import type { PipetteNameSpecs } from '@opentrons/shared-data'
import { RadioGroup } from '@opentrons/components'
import { pipetteNameBlocklist, pipetteSlot } from '../constant'
import { useFormikContext } from 'formik'
import type { ActionMeta } from 'react-select'

export interface PipetteSelectProps {
  /** currently selected value, optional in case selecting triggers immediate action */
  pipetteName?: string | null
  /** react-select change handler */
  onPipetteChange: (
    pipetteName: string | null,
    e: ActionMeta<SelectOption>
  ) => void
  /** list of pipette names to omit */
  nameBlocklist?: string[]
  /** whether or not "None" shows up as the default option */
  enableNoneOption?: boolean
  /** input tabIndex */
  tabIndex?: string | number
  /** classes to apply to the top-level component */
  className?: string
  /** custom id to be applied. likely to be used as a data test id for e2e testing */
  id?: string
}

const PIPETTE_SORT = ['maxVolume', 'channels'] as const
// @ts-expect-error(mc, 2021-04-27): use TS type guard for filter
const allPipetteNameSpecs: PipetteNameSpecs[] = getAllPipetteNames(
  ...PIPETTE_SORT
)
  .map(getPipetteNameSpecs)
  .filter(Boolean)

const specsByCategory = groupBy(allPipetteNameSpecs, 'displayCategory')

const specToOption = ({
  name,
  displayName,
}: PipetteNameSpecs): { value: string; name: string } => ({
  value: name,
  name: displayName,
})

export interface SelectOption {
  value: string
  label?: string
  isDisabled?: boolean
}

export const RadioSelect = ({ pipetteName, pipetteType }: any): JSX.Element => {
  const { handleChange, handleBlur } = useFormikContext<any>()
  const allowlist = ({ value }: SelectOption): boolean => {
    return !pipetteNameBlocklist.some(n => n === value)
  }
  const gen3Options = specsByCategory[GEN3].map(specToOption).filter(allowlist)
  const gen1Options = specsByCategory[GEN1].map(specToOption).filter(allowlist)
  let groupedOptions = [
    ...(gen3Options.length > 0 ? gen3Options : []),
    ...(gen1Options.length > 0 ? gen1Options : []),
  ]

  const emptyMount = [
    { value: 'LEAVE_SECOND_EMPTY', name: 'Leave Second Empty' },
  ]

  const newGroupedOptions =
    pipetteName.split('.')[1] === pipetteSlot.right
      ? [...groupedOptions, ...emptyMount]
      : groupedOptions

  return (
    <RadioGroup
      name={pipetteName}
      value={pipetteType}
      options={newGroupedOptions}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
