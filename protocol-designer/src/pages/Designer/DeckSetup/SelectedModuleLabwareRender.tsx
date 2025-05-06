import { LabwareOnDeck as LabwareOnDeckComponent } from '../../../components/organisms'
import { LabwareRenderOnDeck } from './LabwareRenderOnDeck'

import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { LabwareOnDeck } from '../../../step-forms'

interface SelectedModuleLabwareRenderProps {
  nestedLabwareDef: LabwareDefinition2 | null
  labwareDef: LabwareDefinition2 | null
  moduleModel: ModuleModel | null
  labwareOnDeck?: LabwareOnDeck
  nestedLabwareOnDeck?: LabwareOnDeck
}
export function SelectedModuleLabwareRender(
  props: SelectedModuleLabwareRenderProps
): JSX.Element | null {
  const {
    labwareOnDeck,
    labwareDef,
    moduleModel,
    nestedLabwareDef,
    nestedLabwareOnDeck,
  } = props
  return (
    <>
      {labwareDef != null && moduleModel != null ? (
        <LabwareRenderOnDeck labwareDef={labwareDef} x={0} y={0} />
      ) : null}
      {labwareOnDeck != null && moduleModel != null ? (
        <LabwareOnDeckComponent labwareOnDeck={labwareOnDeck} x={0} y={0} />
      ) : null}
      {nestedLabwareDef != null && moduleModel != null ? (
        <LabwareRenderOnDeck labwareDef={nestedLabwareDef} x={0} y={0} />
      ) : null}
      {nestedLabwareOnDeck != null && moduleModel != null ? (
        <LabwareOnDeckComponent
          labwareOnDeck={nestedLabwareOnDeck}
          x={0}
          y={0}
        />
      ) : null}
    </>
  )
}
