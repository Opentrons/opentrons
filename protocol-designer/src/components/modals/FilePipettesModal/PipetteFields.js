// @flow
import React, { useMemo } from 'react'
import {
  DropdownField,
  FormGroup,
  PipetteSelect,
  OutlineButton,
  type Mount,
} from '@opentrons/components'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import isEmpty from 'lodash/isEmpty'
import reduce from 'lodash/reduce'

import { i18n } from '../../../localization'
import { PipetteDiagram } from './PipetteDiagram'
import { TiprackDiagram } from './TiprackDiagram'
import styles from './FilePipettesModal.css'
import formStyles from '../../forms/forms.css'
import { getOnlyLatestDefs } from '../../../labware-defs/utils'

import type { FormPipettesByMount } from '../../../step-forms'

export type Props = {|
  initialTabIndex?: number,
  values: FormPipettesByMount,
  // TODO 2020-3-20 use formik typing here after we update the def in flow-typed
  errors:
    | null
    | string
    | {
        left?: {
          tiprackDefURI: string,
        },
        right?: {
          tiprackDefURI: string,
        },
      },
  touched:
    | null
    | boolean
    | {
        left?: {
          tiprackDefURI: boolean,
        },
        right?: {
          tiprackDefURI: boolean,
        },
      },
  onFieldChange: (event: SyntheticInputEvent<HTMLSelectElement>) => mixed,
  onSetFieldValue: (field: string, value: string | null) => void,
  onSetFieldTouched: (field: string, touched: boolean) => void,
  onBlur: (event: SyntheticFocusEvent<HTMLSelectElement>) => mixed,
  customTipracksEnabled: ?boolean,
|}

// TODO(mc, 2019-10-14): delete this typedef when gen2 ff is removed
type PipetteSelectProps = {| mount: Mount, tabIndex: number |}

export function PipetteFields(props: Props) {
  const {
    values,
    onFieldChange,
    onSetFieldValue,
    onSetFieldTouched,
    onBlur,
    errors,
    touched,
    customTipracksEnabled,
  } = props

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

  const renderPipetteSelect = (props: PipetteSelectProps) => {
    const { tabIndex, mount } = props
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
        {customTipracksEnabled && (
          <PipetteDiagram
            leftPipette={values.left.pipetteName}
            rightPipette={values.right.pipetteName}
            customTipracksEnabled={customTipracksEnabled}
          />
        )}
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
      {!customTipracksEnabled ? (
        <div className={styles.diagrams}>
          <TiprackDiagram definitionURI={values.left.tiprackDefURI} />

          <PipetteDiagram
            leftPipette={values.left.pipetteName}
            rightPipette={values.right.pipetteName}
            customTipracksEnabled={customTipracksEnabled}
          />
          <TiprackDiagram definitionURI={values.right.tiprackDefURI} />
        </div>
      ) : (
        <div>
          <OutlineButton
            className={styles.upload_custom_btn}
            onClick={() => console.log('TODO: Open Upload Modal')}
          >
            upload custom tip rack
          </OutlineButton>
        </div>
      )}
    </React.Fragment>
  )
}
