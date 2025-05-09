import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'
import { LabwareRenderOnDeck } from './LabwareRenderOnDeck'

import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

interface SelectedModuleLabwareRenderProps {
  adapterDef: LabwareDefinition2 | null
  moduleModel: ModuleModel | null
  topLabwareOnDeck?: LabwareOnDeck
}
export function SelectedModuleLabwareRender(
  props: SelectedModuleLabwareRenderProps
): JSX.Element | null {
  const { topLabwareOnDeck, moduleModel, adapterDef } = props

  return (
    <>
      {adapterDef != null && moduleModel != null ? (
        <LabwareRenderOnDeck labwareDef={adapterDef} x={0} y={0} />
      ) : null}

      {topLabwareOnDeck != null && moduleModel != null ? (
        <LabwareOnDeckComponent labwareOnDeck={topLabwareOnDeck} x={0} y={0} />
      ) : null}
    </>
  )
}
