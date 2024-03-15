import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Control,
  Controller,
  FormState,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { FormPipettesByMount } from '../../../step-forms'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getTiprackOptions } from '../utils'
import { PipetteDiagram } from './PipetteDiagram'

import styles from './FilePipettesModal.module.css'
import formStyles from '../../forms/forms.module.css'

import type { PipetteName } from '@opentrons/shared-data'
import type { ThunkDispatch } from 'redux-thunk'
import type { BaseState } from '../../../types'
import type { FormState as TypeFormState } from './index'

export interface Props {
  values: FormPipettesByMount
  setValue: UseFormSetValue<TypeFormState>
  trigger: UseFormTrigger<TypeFormState>
  control: Control<TypeFormState, any>
  formState: FormState<TypeFormState>
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
  const { values, formState, setValue, trigger, control, robotType } = props
  const { t } = useTranslation(['modal', 'button'])
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const allLabware = useSelector(getLabwareDefsByURI)
  const initialTabIndex = 1
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
          // this select does not return an event so we have to manually set the field val
          setValue(`pipettesByMount.${mount}.pipetteName`, pipetteName)
          setValue(`pipettesByMount.${mount}.tiprackDefURI`, null)
          trigger(`pipettesByMount.${mount}.tiprackDefURI`)
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
    const { errors, touchedFields } = formState
    const touched =
      touchedFields.pipettesByMount &&
      touchedFields.pipettesByMount[mount] != null

    const tiprackDefURIError =
      errors.pipettesByMount &&
      errors.pipettesByMount[mount]?.tiprackDefURI != null

    return (
      <Controller
        control={control}
        name={`pipettesByMount.${mount}.tiprackDefURI`}
        render={({ field }) => (
          <DropdownField
            error={
              touched && tiprackDefURIError
                ? //  @ts-expect-error: TS can't tell that pipettesByMount
                  //  won't be undefined
                  errors.pipettesByMount[mount]?.tiprackDefURI?.message
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              field.onChange(e)
              trigger(`pipettesByMount.${mount}.tiprackDefURI`)
            }}
            onBlur={field.onBlur}
          />
        )}
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
                ? t('pipette_fields.pipette')
                : t('pipette_fields.left_pipette')
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
                ? t('pipette_fields.tiprack')
                : t('pipette_fields.left_tiprack')
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
              label={t('pipette_fields.right_pipette')}
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
              label={t('pipette_fields.right_tiprack')}
              className={formStyles.stacked_row}
            >
              {renderTiprackSelect({ mount: 'right', robotType })}
            </FormGroup>
          </div>
        )}
      </div>
      <div>
        <OutlineButton Component="label" className={styles.upload_button}>
          {t('button:upload_custom_tip_rack')}
          <input
            type="file"
            onChange={e => dispatch(createCustomTiprackDef(e))}
          />
        </OutlineButton>
      </div>
    </>
  )
}
