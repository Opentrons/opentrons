import * as React from 'react'

import startCase from 'lodash/startCase'
import mapValues from 'lodash/mapValues'
import forOwn from 'lodash/forOwn'
import keys from 'lodash/keys'
import omit from 'lodash/omit'
import set from 'lodash/set'
import { Box, OVERFLOW_AUTO } from '@opentrons/components'
import { ConfigFormResetButton } from './ConfigFormResetButton'
import {
  ConfigFormGroup,
  FormColumn,
  ConfigQuirkGroup,
} from './ConfigFormGroup'

import type { FormValues } from './ConfigFormGroup'
import type {
  PipetteSettingsField,
  PipetteSettingsFieldsMap,
  UpdatePipetteSettingsData,
} from '@opentrons/api-client'
import { FieldError, Resolver, useForm } from 'react-hook-form'

export interface DisplayFieldProps extends PipetteSettingsField {
  name: string
  displayName: string
}

export interface DisplayQuirkFieldProps {
  name: string
  displayName: string
  [quirkId: string]: boolean | string
}

export interface ConfigFormProps {
  settings: PipetteSettingsFieldsMap
  updateInProgress: boolean
  updateSettings: (params: UpdatePipetteSettingsData) => void
  groupLabels: string[]
  formId: string
}

const PLUNGER_KEYS = ['top', 'bottom', 'blowout', 'dropTip']
const POWER_KEYS = ['plungerCurrent', 'pickUpCurrent', 'dropTipCurrent']
const TIP_KEYS = ['dropTipSpeed', 'pickUpDistance']
const QUIRK_KEY = 'quirks'

export const ConfigForm = (props: ConfigFormProps): JSX.Element => {
  const {
    updateInProgress,
    formId,
    settings,
    updateSettings,
    groupLabels,
  } = props

  const getFieldsByKey = (
    keys: string[],
    fields: PipetteSettingsFieldsMap
  ): DisplayFieldProps[] => {
    return keys.map(k => {
      const field = fields[k]
      const displayName = startCase(k)
      const name = k
      return {
        ...field,
        name,
        displayName,
      }
    })
  }

  const getKnownQuirks = (): DisplayQuirkFieldProps[] => {
    const quirks = settings[QUIRK_KEY]
    if (!quirks) return []
    const quirkKeys = Object.keys(quirks)
    return quirkKeys.map<DisplayQuirkFieldProps>((name: string) => {
      const value = quirks[name]
      const displayName = startCase(name)
      return {
        [name]: value,
        name,
        displayName,
      }
    })
  }

  const getVisibleFields = (): PipetteSettingsFieldsMap => {
    return omit(settings, [QUIRK_KEY])
  }

  const getUnknownKeys = (): string[] => {
    return keys(
      omit(settings, [...PLUNGER_KEYS, ...POWER_KEYS, ...TIP_KEYS, QUIRK_KEY])
    )
  }

  const onSubmit: (values: FormValues) => void = values => {
    const fields = mapValues<
      FormValues,
      { value: PipetteSettingsField['value'] } | null
    >(values, v => {
      if (v === true || v === false) return { value: v }
      if (v === '' || v == null) return null
      return { value: Number(v) }
    })

    updateSettings({ fields })
  }

  const getFieldValue = (
    key: string,
    fields: DisplayFieldProps[],
    values: FormValues
  ): number => {
    const field = fields.find(f => f.name === key)
    const _default = field && field.default
    const value = values[key] || _default
    return Number(value)
  }

  const validate = (
    values: FormValues,
    errors: Record<string, FieldError>
  ): Record<string, FieldError> => {
    const fields = getVisibleFields()
    const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)

    // validate all visible fields with min and max
    forOwn(fields, (field, name) => {
      // @ts-expect-error TODO: value needs to be of type string here, but technically that's not prover
      const value = values[name]?.trim()
      const { min, max } = field
      if (value !== '') {
        const parsed = Number(value)
        if (Number.isNaN(parsed)) {
          set(errors, name, `number required`)
        } else if (
          typeof min === 'number' &&
          typeof max === 'number' &&
          // TODO(bc, 2021-05-18): this should probably be (parsed < min || parsed > max) so we're not accidentally comparing a string to a number
          (parsed < min || value > max)
        ) {
          set(errors, name, {
            type: 'numberError',
            message: `Min ${min} / Max ${max}`,
          })
        }
      }
    })

    const plungerGroupError =
      'Please ensure the following: \n top > bottom > blowout > droptip'
    const top = getFieldValue('top', plungerFields, values)
    const bottom = getFieldValue('bottom', plungerFields, values)
    const blowout = getFieldValue('blowout', plungerFields, values)
    const dropTip = getFieldValue('dropTip', plungerFields, values)
    if (top <= bottom || bottom <= blowout || blowout <= dropTip) {
      set(errors, 'plungerError', {
        type: 'plungerError',
        message: plungerGroupError,
      })
    }

    return errors
  }

  const resolver: Resolver<FormValues> = values => {
    let errors = {}
    errors = validate(values, errors)
    return { values, errors }
  }

  const getInitialValues: () => FormValues = () => {
    const fields = getVisibleFields()
    const initialFieldValues = mapValues<
      PipetteSettingsFieldsMap,
      string | boolean
    >(fields, f => {
      if (f.value === true || f.value === false) return f.value
      // @ts-expect-error(sa, 2021-05-27): avoiding src code change, use optional chain to access f.value
      return f.value !== f.default ? f.value.toString() : ''
    })
    const initialQuirkValues = settings[QUIRK_KEY]
    const initialValues = Object.assign(
      {},
      initialFieldValues,
      initialQuirkValues
    )

    return initialValues
  }

  const fields = getVisibleFields()
  const UNKNOWN_KEYS = getUnknownKeys()
  const plungerFields = getFieldsByKey(PLUNGER_KEYS, fields)
  const powerFields = getFieldsByKey(POWER_KEYS, fields)
  const tipFields = getFieldsByKey(TIP_KEYS, fields)
  const quirkFields = getKnownQuirks()
  const quirksPresent = quirkFields.length > 0
  const unknownFields = getFieldsByKey(UNKNOWN_KEYS, fields)
  const initialValues = getInitialValues()

  const {
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: initialValues,
    resolver: resolver,
  })

  const handleReset = (): void => {
    const newValues = mapValues(getValues(), v => {
      if (typeof v === 'boolean') {
        // NOTE: checkbox fields don't have defaults from the API b/c they come in from `quirks`
        // For now, we'll reset all checkboxes to true
        return true
      }
      return ''
    })
    reset(newValues)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id={formId}>
      <Box overflowY={OVERFLOW_AUTO}>
        <ConfigFormResetButton
          onClick={handleReset}
          disabled={updateInProgress}
        />
        <FormColumn>
          <ConfigFormGroup
            groupLabel={groupLabels[0]}
            groupError={errors.plungerError?.message}
            formFields={plungerFields}
            control={control}
          />
          <ConfigFormGroup
            groupLabel={groupLabels[1]}
            formFields={[...tipFields, ...unknownFields]}
            control={control}
          />
          {quirksPresent && (
            <ConfigQuirkGroup quirks={quirkFields} control={control} />
          )}
        </FormColumn>
        <FormColumn>
          <ConfigFormGroup
            groupLabel={groupLabels[2]}
            control={control}
            formFields={powerFields}
          />
        </FormColumn>
      </Box>
    </form>
  )
}
