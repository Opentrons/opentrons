// @flow
import * as React from 'react'
import {
  DropdownField,
  FormGroup,
  type Mount,
} from '@opentrons/components'
import isEmpty from 'lodash/isEmpty'
import i18n from '../../../localization'
import {pipetteOptions} from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import type {FormPipette} from '../../../step-forms'

const pipetteOptionsWithNone = [
  {name: 'None', value: ''},
  ...pipetteOptions,
]

// TODO: Ian 2018-06-22 get this programatically from shared-data labware defs
// and exclude options that are incompatible with pipette
// and also auto-select tiprack if there's only one compatible tiprack for a pipette
const tiprackOptions = [
  {name: '10 μL', value: 'tiprack-10ul'},
  {name: '200 μL', value: 'tiprack-200ul'},
  {name: '300 μL', value: 'opentrons-tiprack-300ul'},
  {name: '1000 μL', value: 'tiprack-1000ul'},
]

type Props = {
  initialTabIndex?: number,
  values: {[Mount]: FormPipette},
  // this handleChange should expect all fields to have name={Mount.pipetteFieldName}
  handleChange: (SyntheticInputEvent<*>) => mixed,
}

export default function ChangePipetteFields (props: Props) {
  const {
    values,
    handleChange,
  } = props
  const initialTabIndex = props.initialTabIndex || 1
  return (
    <React.Fragment>
      <div className={styles.mount_fields_row}>
        <div className={styles.mount_column}>
          <FormGroup
            key="leftPipetteModel"
            label={i18n.t('modal.pipette_fields.left_pipette')}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 1}
              options={pipetteOptionsWithNone}
              value={values.left.pipetteName}
              name='left.pipetteName'
              onChange={handleChange} />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.left.pipetteName)}
            key={'leftTiprackModel'}
            label={i18n.t('modal.pipette_fields.left_tiprack')}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 2}
              disabled={isEmpty(values.left.pipetteName)}
              options={tiprackOptions}
              value={values.left.tiprackModel}
              name='left.tiprackModel'
              onChange={handleChange} />
          </FormGroup>
        </div>
        <div className={styles.mount_column}>
          <FormGroup key="rightPipetteModel"
            label={i18n.t('modal.pipette_fields.right_pipette')}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 3}
              options={pipetteOptionsWithNone}
              value={values.right.pipetteName}
              name='right.pipetteName'
              onChange={handleChange} />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.right.pipetteName)}
            key={'rightTiprackModel'}
            label={i18n.t('modal.pipette_fields.right_tiprack')}
            className={formStyles.stacked_row}>
            <DropdownField
              tabIndex={initialTabIndex + 4}
              disabled={isEmpty(values.right.pipetteName)}
              options={tiprackOptions}
              value={values.right.tiprackModel}
              name='right.tiprackModel'
              onChange={handleChange} />
          </FormGroup>
        </div>
      </div>

      <div className={styles.diagrams}>
        <TiprackDiagram containerType={values.left.tiprackModel} />
        <PipetteDiagram
          leftPipette={values.left.pipetteName}
          rightPipette={values.right.pipetteName}
        />
        <TiprackDiagram containerType={values.right.tiprackModel} />
      </div>
    </React.Fragment>
  )
}
