// @flow
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  DropdownField,
  FormGroup,
  PipetteSelect,
  type Mount,
} from '@opentrons/components'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'

import i18n from '../../../localization'
import { PipetteDiagram } from './PipetteDiagram'
import TiprackDiagram from './TiprackDiagram'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import { getOnlyLatestDefs } from '../../../labware-defs/utils'

import type { FormPipette, FormPipettesByMount } from '../../../step-forms'
import { getEnableMultiGEN2Pipettes } from '../../../feature-flags/selectors'

type Props = {|
  initialTabIndex?: number,
  values: FormPipettesByMount,
  onFieldChange: (
    mount: Mount,
    fieldName: $Keys<FormPipette>,
    value: string | null
  ) => mixed,
|}

// TODO(mc, 2019-10-14): delete this typedef when gen2 ff is removed
type PipetteSelectProps = {| mount: Mount, tabIndex: number |}

export function ChangePipetteFields(props: Props) {
  const { values, onFieldChange } = props
  const enableMultiGEN2 = useSelector(getEnableMultiGEN2Pipettes)

  const tiprackOptions = useMemo(() => {
    const defs = getOnlyLatestDefs()
    return reduce(
      defs,
      (acc, def: $Values<typeof defs>) => {
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
    )
  }, [])

  const initialTabIndex = props.initialTabIndex || 1

  const makeHandleChange = (mount: Mount, fieldName: $Keys<FormPipette>) => (
    e: SyntheticInputEvent<HTMLInputElement | HTMLSelectElement>
  ) => onFieldChange(mount, fieldName, e.currentTarget.value || null)

  const renderPipetteSelect = (props: PipetteSelectProps) => {
    const { tabIndex, mount } = props
    const pipetteName = values[mount].pipetteName
    const nameBlacklist = enableMultiGEN2
      ? []
      : ['p20_multi_gen2', 'p300_multi_gen2']
    return (
      <PipetteSelect
        enableNoneOption
        tabIndex={tabIndex}
        nameBlacklist={nameBlacklist}
        pipetteName={pipetteName != null ? pipetteName : null}
        onPipetteChange={pipetteName => {
          onFieldChange(mount, 'pipetteName', pipetteName)
        }}
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
            })}
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
              onChange={makeHandleChange('left', 'tiprackDefURI')}
            />
          </FormGroup>
        </div>
        <div className={styles.mount_column}>
          <FormGroup
            key="rightPipetteModel"
            label={i18n.t('modal.pipette_fields.right_pipette')}
            className={formStyles.stacked_row}
          >
            {renderPipetteSelect({
              mount: 'right',
              tabIndex: initialTabIndex + 3,
            })}
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
              onChange={makeHandleChange('right', 'tiprackDefURI')}
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
