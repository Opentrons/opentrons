// @flow
import React, { useMemo } from 'react'
import { DropdownField, FormGroup, type Mount } from '@opentrons/components'
import { getLabwareDefURI } from '@opentrons/shared-data'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'
import i18n from '../../../localization'
import { pipetteOptions } from '../../../pipettes/pipetteData'
import PipetteDiagram from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import { getOnlyLatestDefs } from '../../../labware-defs/utils'
import type { FormPipette } from '../../../step-forms'

const pipetteOptionsWithNone = [{ name: 'None', value: '' }, ...pipetteOptions]

type Props = {
  initialTabIndex?: number,
  values: { [Mount]: FormPipette },
  // this handleChange should expect all fields to have name={Mount.pipetteFieldName}
  handleChange: (SyntheticInputEvent<*>) => mixed,
}

export default function ChangePipetteFields(props: Props) {
  const { values, handleChange } = props

  const tiprackOptions = useMemo(() => {
    const defs = getOnlyLatestDefs()
    return reduce(
      defs,
      (acc, def: $Values<typeof defs>) => {
        if (def.metadata.displayCategory !== 'tipRack') return acc
        return [
          ...acc,
          {
            name: def.metadata.displayName,
            value: getLabwareDefURI(def),
          },
        ]
      },
      []
    )
  }, [])

  const initialTabIndex = props.initialTabIndex || 1
  return (
    <React.Fragment>
      <div className={styles.mount_fields_row}>
        <div className={styles.mount_column}>
          <FormGroup
            key="leftPipetteModel"
            label={i18n.t('modal.pipette_fields.left_pipette')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              tabIndex={initialTabIndex + 1}
              options={pipetteOptionsWithNone}
              value={values.left.pipetteName}
              name="left.pipetteName"
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.left.pipetteName)}
            key={'leftTiprackModel'}
            label={i18n.t('modal.pipette_fields.left_tiprack')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              tabIndex={initialTabIndex + 2}
              disabled={isEmpty(values.left.pipetteName)}
              options={tiprackOptions}
              value={values.left.tiprackDefURI}
              name="left.tiprackDefURI"
              onChange={handleChange}
            />
          </FormGroup>
        </div>
        <div className={styles.mount_column}>
          <FormGroup
            key="rightPipetteModel"
            label={i18n.t('modal.pipette_fields.right_pipette')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              tabIndex={initialTabIndex + 3}
              options={pipetteOptionsWithNone}
              value={values.right.pipetteName}
              name="right.pipetteName"
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup
            disabled={isEmpty(values.right.pipetteName)}
            key={'rightTiprackModel'}
            label={i18n.t('modal.pipette_fields.right_tiprack')}
            className={formStyles.stacked_row}
          >
            <DropdownField
              tabIndex={initialTabIndex + 4}
              disabled={isEmpty(values.right.pipetteName)}
              options={tiprackOptions}
              value={values.right.tiprackDefURI}
              name="right.tiprackDefURI"
              onChange={handleChange}
            />
          </FormGroup>
        </div>
      </div>

      <div className={styles.diagrams}>
        <TiprackDiagram definitionURI={values.left.tiprackDefURI} />
        <PipetteDiagram
          leftPipette={values.left.pipetteName}
          rightPipette={values.right.pipetteName}
        />
        <TiprackDiagram definitionURI={values.right.tiprackDefURI} />
      </div>
    </React.Fragment>
  )
}
