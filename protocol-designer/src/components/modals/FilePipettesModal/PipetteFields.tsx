import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  DropdownField,
  FormGroup,
  PipetteSelect,
  OutlineButton,
  Mount,
  SelectOption,
} from '@opentrons/components'
import {
  getAllPipetteNames,
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteNameSpecs,
  OT3_PIPETTES,
} from '@opentrons/shared-data'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import { i18n } from '../../../localization'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { PipetteDiagram } from './PipetteDiagram'

import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'

import { FormPipettesByMount } from '../../../step-forms'
import { DropdownOption } from '../../../../../components/src/forms/DropdownField'

import type { PipetteName } from '@opentrons/shared-data'

export interface Props {
  initialTabIndex?: number
  values: FormPipettesByMount
  // TODO 2020-3-20 use formik typing here after we update the def in flow-typed
  errors:
    | null
    | string
    | {
        left?: {
          tiprackDefURI: string
        }
        right?: {
          tiprackDefURI: string
        }
      }
  touched:
    | null
    | boolean
    | {
        left?: {
          tiprackDefURI: boolean
        }
        right?: {
          tiprackDefURI: boolean
        }
      }
  onFieldChange: (event: React.ChangeEvent<HTMLSelectElement>) => unknown
  onSetFieldValue: (field: string, value: string | null) => void
  onSetFieldTouched: (field: string, touched: boolean) => void
  onBlur: (event: React.FocusEvent<HTMLSelectElement>) => unknown
}

// TODO(mc, 2019-10-14): delete this typedef when gen2 ff is removed
interface PipetteSelectProps {
  mount: Mount
  tabIndex: number
  filteredOptions?: SelectOption[]
}

interface GEN3PipetteOptions {
  value: PipetteName
  label: string | undefined
}

export function PipetteFields(props: Props): JSX.Element {
  const {
    values,
    onFieldChange,
    onSetFieldValue,
    onSetFieldTouched,
    onBlur,
    errors,
    touched,
  } = props

  const dispatch = useDispatch()

  const allLabware = useSelector(getLabwareDefsByURI)

  const enableOT3Support = useSelector(featureFlagSelectors.getEnabledOT3)

  // TODO(sh, 2022-09-29): remove this list of OT-3 tip racks when the feature flag is removed
  const OT_3_TIP_RACKS = [
    'opentrons_ot3_96_tiprack_200ul',
    'opentrons_ot3_96_tiprack_1000ul',
    'opentrons_ot3_96_tiprack_50ul',
  ]

  type Values<T> = T[keyof T]

  const tiprackOptions = reduce<typeof allLabware, DropdownOption[]>(
    allLabware,
    (acc, def: Values<typeof allLabware>) => {
      if (
        (!enableOT3Support &&
          OT_3_TIP_RACKS.includes(def.parameters.loadName)) ||
        def.metadata.displayCategory !== 'tipRack'
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
  )

  const initialTabIndex = props.initialTabIndex || 1

  const getGEN3PipetteOptions = (
    pipettes: PipetteName[]
  ): GEN3PipetteOptions[] => {
    const getGEN3Pipettes = pipettes.filter(
      pipette => getPipetteNameSpecs(pipette)?.displayCategory === 'GEN3'
    )
    const options = getGEN3Pipettes.map(pipette => {
      return {
        value: pipette,
        label: getPipetteNameSpecs(pipette)?.displayName,
      }
    })
    return options
  }

  const renderPipetteSelect = (props: PipetteSelectProps): JSX.Element => {
    const { tabIndex, mount, filteredOptions } = props
    const pipetteName = values[mount].pipetteName

    return (
      <PipetteSelect
        enableNoneOption
        tabIndex={tabIndex}
        pipetteName={pipetteName != null ? pipetteName : null}
        onPipetteChange={pipetteName => {
          const nameAccessor = `pipettesByMount.${mount}.pipetteName`
          const value = pipetteName
          const targetToClear = `pipettesByMount.${mount}.tiprackDefURI`
          // this select does not return an event so we have to manually set the field val
          onSetFieldValue(nameAccessor, value)
          onSetFieldValue(targetToClear, null)
          onSetFieldTouched(targetToClear, false)
        }}
        nameBlocklist={enableOT3Support ? [] : OT3_PIPETTES}
        id={`PipetteSelect_${mount}`}
        filteredOptions={filteredOptions}
      />
    )
  }

  return (
    <React.Fragment>
      <div className={styles.mount_fields_row}>
        <div className={styles.mount_column}>
          <FormGroup
            key="leftPipetteModel"
            label={i18n.t('modal.pipette_fields.left_pipette')}
            className={formStyles.stacked_row}
          >
            {renderPipetteSelect({
              mount: 'left',
              tabIndex: initialTabIndex + 1,
              filteredOptions:
                getPipetteNameSpecs(values.right.pipetteName as PipetteName)
                  ?.displayCategory === 'GEN3'
                  ? getGEN3PipetteOptions(getAllPipetteNames())
                  : [],
            })}
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.left.pipetteName)}
            key={'leftTiprackModel'}
            label={i18n.t('modal.pipette_fields.left_tiprack')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              error={
                // TODO JF 2020-3-19 allow dropdowns to take error
                // components from formik so we avoid manually doing this
                touched &&
                typeof touched !== 'boolean' &&
                touched.left &&
                touched.left.tiprackDefURI &&
                errors !== null &&
                typeof errors !== 'string' &&
                errors.left
                  ? errors.left.tiprackDefURI
                  : null
              }
              tabIndex={initialTabIndex + 2}
              disabled={isEmpty(values.left.pipetteName)}
              options={tiprackOptions}
              value={values.left.tiprackDefURI}
              name="pipettesByMount.left.tiprackDefURI"
              onChange={onFieldChange}
              onBlur={onBlur}
            />
          </FormGroup>
        </div>
        <PipetteDiagram
          leftPipette={values.left.pipetteName}
          rightPipette={values.right.pipetteName}
        />
        <div className={styles.mount_column}>
          <FormGroup
            key="rightPipetteModel"
            label={i18n.t('modal.pipette_fields.right_pipette')}
            className={formStyles.stacked_row}
          >
            {renderPipetteSelect({
              mount: 'right',
              tabIndex: initialTabIndex + 3,
              filteredOptions:
                getPipetteNameSpecs(values.left.pipetteName as PipetteName)
                  ?.displayCategory === 'GEN3'
                  ? getGEN3PipetteOptions(getAllPipetteNames())
                  : [],
            })}
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.right.pipetteName)}
            key={'rightTiprackModel'}
            label={i18n.t('modal.pipette_fields.right_tiprack')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              error={
                // TODO JF 2020-3-19 allow dropdowns to take error
                // components from formik so we avoid manually doing this
                touched &&
                typeof touched !== 'boolean' &&
                touched.right &&
                touched.right.tiprackDefURI &&
                errors !== null &&
                typeof errors !== 'string' &&
                errors.right
                  ? errors.right.tiprackDefURI
                  : null
              }
              tabIndex={initialTabIndex + 4}
              disabled={isEmpty(values.right.pipetteName)}
              options={tiprackOptions}
              value={values.right.tiprackDefURI}
              name="pipettesByMount.right.tiprackDefURI"
              onChange={onFieldChange}
              onBlur={onBlur}
            />
          </FormGroup>
        </div>
      </div>
      <div>
        <OutlineButton Component="label" className={styles.upload_button}>
          {i18n.t('button.upload_custom_tip_rack')}
          <input
            type="file"
            onChange={e => dispatch(createCustomTiprackDef(e))}
          />
        </OutlineButton>
      </div>
    </React.Fragment>
  )
}
