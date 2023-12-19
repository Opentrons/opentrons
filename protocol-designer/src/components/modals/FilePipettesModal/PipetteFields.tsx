import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import {
  DropdownField,
  FormGroup,
  PipetteSelect,
  OutlineButton,
  Mount,
} from '@opentrons/components'
import {
  getIncompatiblePipetteNames,
  OT2_PIPETTES,
  OT2_ROBOT_TYPE,
  OT3_PIPETTES,
  RIGHT,
  RobotType,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { FormPipettesByMount } from '../../../step-forms'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getTiprackOptions } from '../utils'
import { PipetteDiagram } from './PipetteDiagram'

import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'

import type { PipetteName } from '@opentrons/shared-data'
import { ThunkDispatch } from 'redux-thunk'
import { BaseState } from '../../../types'
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
  robotType: RobotType
}

// TODO(mc, 2019-10-14): delete this typedef when gen2 ff is removed
interface PipetteSelectProps {
  mount: Mount
  tabIndex: number
  nameBlocklist?: string[]
}

interface TiprackSelectProps {
  mount: Mount
  robotType: RobotType
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
    robotType,
  } = props

  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const allLabware = useSelector(getLabwareDefsByURI)
  const initialTabIndex = props.initialTabIndex || 1
  const has96Channel = values.left.pipetteName === 'p1000_96'

  React.useEffect(() => {
    if (has96Channel) {
      values.right = { pipetteName: null, tiprackDefURI: null }
    }
  }, [values.left])

  const renderPipetteSelect = (props: PipetteSelectProps): JSX.Element => {
    const { tabIndex, mount } = props
    const pipetteName = values[mount].pipetteName

    const filter96 = mount === RIGHT ? ['p1000_96'] : []

    return (
      <PipetteSelect
        nameBlocklist={
          robotType === OT2_ROBOT_TYPE
            ? OT3_PIPETTES
            : [...OT2_PIPETTES, ...filter96]
        }
        enableNoneOption
        tabIndex={tabIndex}
        pipetteName={pipetteName != null ? pipetteName : null}
        onPipetteChange={pipetteName => {
          const nameAccessor = `pipettesByMount.${mount}.pipetteName`
          const nameAccessorValue = pipetteName
          const targetToClear = `pipettesByMount.${mount}.tiprackDefURI`
          // this select does not return an event so we have to manually set the field val
          onSetFieldValue(nameAccessor, nameAccessorValue)
          onSetFieldValue(targetToClear, null)
          onSetFieldTouched(targetToClear, false)
        }}
        disabled={mount === RIGHT && has96Channel}
        id={`PipetteSelect_${mount}`}
        className={styles.pipette_select}
      />
    )
  }

  const renderTiprackSelect = (props: TiprackSelectProps): JSX.Element => {
    const { mount } = props
    const selectedPipetteName = values[mount].pipetteName
    const tiprackOptions = getTiprackOptions({
      allLabware: allLabware,
      allowAllTipracks: allowAllTipracks,
      selectedPipetteName: selectedPipetteName,
    })

    return (
      <DropdownField
        error={
          touched &&
          typeof touched !== 'boolean' &&
          touched[mount]?.tiprackDefURI &&
          errors !== null &&
          typeof errors !== 'string' &&
          errors[mount] != null
            ? errors[mount]?.tiprackDefURI
            : null
        }
        tabIndex={initialTabIndex + 2}
        disabled={
          isEmpty(values[mount].pipetteName) ||
          (mount === RIGHT && has96Channel)
        }
        options={tiprackOptions}
        value={values[mount].tiprackDefURI}
        name={`pipettesByMount.${mount}.tiprackDefURI`}
        onChange={onFieldChange}
        onBlur={onBlur}
      />
    )
  }

  return (
    <>
      <div className={styles.mount_fields_row} style={{ overflowX: 'hidden' }}>
        <div style={{ width: '13.8rem' }}>
          <FormGroup
            key="leftPipetteModel"
            label={
              has96Channel
                ? i18n.t('modal.pipette_fields.pipette')
                : i18n.t('modal.pipette_fields.left_pipette')
            }
            className={formStyles.stacked_row}
          >
            {renderPipetteSelect({
              mount: 'left',
              tabIndex: initialTabIndex + 1,
              nameBlocklist: getIncompatiblePipetteNames(
                values.right.pipetteName as PipetteName
              ),
            })}
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.left.pipetteName)}
            key={'leftTiprackModel'}
            label={
              has96Channel
                ? i18n.t('modal.pipette_fields.tiprack')
                : i18n.t('modal.pipette_fields.left_tiprack')
            }
            className={formStyles.stacked_row}
          >
            {renderTiprackSelect({ mount: 'left', robotType })}
          </FormGroup>
        </div>
        <PipetteDiagram
          leftPipette={values.left.pipetteName}
          rightPipette={values.right.pipetteName}
        />
        {has96Channel ? (
          <div style={{ width: '13.8rem' }} />
        ) : (
          <div style={{ width: '13.8rem' }}>
            <FormGroup
              key="rightPipetteModel"
              label={i18n.t('modal.pipette_fields.right_pipette')}
              className={formStyles.stacked_row}
            >
              {renderPipetteSelect({
                mount: 'right',
                tabIndex: initialTabIndex + 3,
                nameBlocklist: getIncompatiblePipetteNames(
                  values.left.pipetteName as PipetteName
                ),
              })}
            </FormGroup>
            <FormGroup
              disabled={isEmpty(values.right.pipetteName)}
              key={'rightTiprackModel'}
              label={i18n.t('modal.pipette_fields.right_tiprack')}
              className={formStyles.stacked_row}
            >
              {renderTiprackSelect({ mount: 'right', robotType })}
            </FormGroup>
          </div>
        )}
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
    </>
  )
}
