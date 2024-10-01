import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { getPipetteEntities } from '../../../../../step-forms/selectors'
import { getTiprackOptions } from '../../../../../ui/labware/selectors'
import { DropdownStepFormField } from '../../../../../molecules'
import type { FieldProps } from '../types'

interface TiprackFieldProps extends FieldProps {
  pipetteId?: unknown
}
export function TiprackField(props: TiprackFieldProps): JSX.Element {
  const { value, updateValue, pipetteId } = props
  const { t } = useTranslation('protocol_steps')
  const pipetteEntities = useSelector(getPipetteEntities)
  const options = useSelector(getTiprackOptions)
  const defaultTiprackUris =
    pipetteId != null ? pipetteEntities[pipetteId as string].tiprackDefURI : []
  const tiprackOptions = options.filter(option =>
    defaultTiprackUris.includes(option.value)
  )

  useEffect(() => {
    //  if default value is not included in the pipette's tiprack uris then
    //  change it so it is
    if (!defaultTiprackUris.includes(value as string)) {
      updateValue(defaultTiprackUris[0])
    }
  }, [defaultTiprackUris, value, updateValue])
  const hasMissingTiprack = defaultTiprackUris.length > tiprackOptions.length
  return (
    <DropdownStepFormField
      {...props}
      options={tiprackOptions}
      value={String(value) != null ? String(value) : null}
      title={t('select_tiprack')}
      tooltipContent={hasMissingTiprack ? 'missing_tiprack' : null}
    />
  )
}
