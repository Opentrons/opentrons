import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import isEmpty from 'lodash/isEmpty'
import { FormGroup, PipetteSelect, OutlineButton } from '@opentrons/components'
import {
  getIncompatiblePipetteNames,
  OT2_PIPETTES,
  OT2_ROBOT_TYPE,
  OT3_PIPETTES,
  RIGHT,
} from '@opentrons/shared-data'
import { createCustomTiprackDef } from '../../../labware-defs/actions'
import { getLabwareDefsByURI } from '../../../labware-defs/selectors'
import { getAllowAllTipracks } from '../../../feature-flags/selectors'
import { getTiprackOptions } from '../utils'
import { PipetteDiagram } from './PipetteDiagram'
import { TiprackSelect } from './TiprackSelect'

import styles from './FilePipettesModal.module.css'
import formStyles from '../../forms/forms.module.css'

import type {
  Control,
  FormState,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form'
import type { ThunkDispatch } from 'redux-thunk'
import type { Mount } from '@opentrons/components'
import type { RobotType, PipetteName } from '@opentrons/shared-data'
import type { FormPipettesByMount } from '../../../step-forms'
import type { BaseState } from '../../../types'
import type { FormState as TypeFormState } from './index'

export interface PipetteFieldsProps {
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

export function PipetteFields(props: PipetteFieldsProps): JSX.Element {
  const { values, setValue, trigger, robotType } = props
  const { t } = useTranslation(['modal', 'button'])
  const allowAllTipracks = useSelector(getAllowAllTipracks)
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const allLabware = useSelector(getLabwareDefsByURI)
  const initialTabIndex = 1
  const has96Channel = values.left.pipetteName === 'p1000_96'

  useEffect(() => {
    if (has96Channel) {
      values.right = { pipetteName: null, tiprackDefURI: null }
    }
  }, [has96Channel, values.left])

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

    return (
      <TiprackSelect
        mount={mount}
        tiprackOptions={tiprackOptions}
        values={values}
        onSetFieldValue={(field: string, value: string[]): void => {
          //  @ts-expect-error: TS can't figure out this type with react-hook-form
          setValue(field, value)
          trigger(`pipettesByMount.${mount}.tiprackDefURI`)
        }}
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
