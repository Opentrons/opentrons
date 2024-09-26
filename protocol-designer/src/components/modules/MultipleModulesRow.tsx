import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  LabeledValue,
  OutlineButton,
  ModuleIcon,
  C_DARK_GRAY,
  SPACING,
} from '@opentrons/components'
import { actions as stepFormActions } from '../../step-forms'
import { DEFAULT_MODEL_FOR_MODULE_TYPE } from '../../constants'
import { ModuleDiagram } from './ModuleDiagram'
import { FlexSlotMap } from './FlexSlotMap'
import type { ModuleModel, ModuleType } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../step-forms'

import styles from './styles.module.css'

interface MultipleModulesRowProps {
  moduleType: ModuleType
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => void
  moduleOnDeckType?: ModuleType
  moduleOnDeckModel?: ModuleModel
  moduleOnDeck?: ModuleOnDeck[]
}

export function MultipleModulesRow(
  props: MultipleModulesRowProps
): JSX.Element {
  const {
    moduleOnDeck,
    openEditModuleModal,
    moduleOnDeckModel,
    moduleOnDeckType,
    moduleType,
  } = props
  const { t } = useTranslation(['modules', 'shared'])
  const dispatch = useDispatch()

  const type: ModuleType = moduleOnDeckType ?? moduleType
  const occupiedSlots = moduleOnDeck?.map(module => module.slot) ?? []
  const occupiedSlotsDisplayName = (
    moduleOnDeck?.map(module => module.slot) ?? []
  ).join(', ')

  const setCurrentModule = (
    moduleType: ModuleType,
    moduleId?: string
  ) => () => {
    openEditModuleModal(moduleType, moduleId)
  }

  const addRemoveText = moduleOnDeck ? t('shared:remove') : t('shared:add')

  const handleAddOrRemove = (): void => {
    if (moduleOnDeck != null) {
      moduleOnDeck.forEach(module => {
        dispatch(stepFormActions.deleteModule(module.id))
      })
    } else {
      setCurrentModule(type)
    }
  }
  const handleEditModule =
    moduleOnDeck && setCurrentModule(type, moduleOnDeck[0].id)

  return (
    <div style={{ marginBottom: SPACING.spacing16 }}>
      <h4 className={styles.row_title}>
        <ModuleIcon
          moduleType={type}
          size="1rem"
          color={C_DARK_GRAY}
          marginRight={SPACING.spacing4}
        />
        {t(
          `module_display_names.${
            occupiedSlots.length > 1 ? `multiple${type}s` : type
          }`
        )}
      </h4>
      <div className={styles.module_row}>
        <div className={styles.module_diagram_container}>
          <ModuleDiagram
            type={type}
            model={moduleOnDeckModel || DEFAULT_MODEL_FOR_MODULE_TYPE[type]}
          />
        </div>
        <div className={styles.module_col}>
          {moduleOnDeckModel && (
            <LabeledValue
              label="Model"
              value={t(`model_display_name.${moduleOnDeckModel}`)}
            />
          )}
        </div>
        <div className={styles.module_col}>
          {occupiedSlots.length > 0 ? (
            <LabeledValue label="Position" value={occupiedSlotsDisplayName} />
          ) : null}
        </div>
        <div className={styles.slot_map}>
          {occupiedSlots.length > 0 ? (
            <FlexSlotMap selectedSlots={occupiedSlots} />
          ) : null}
        </div>
        <div className={styles.modules_button_group}>
          {moduleOnDeck != null ? (
            <OutlineButton
              className={styles.module_button}
              onClick={handleEditModule}
            >
              {t('shared:edit')}
            </OutlineButton>
          ) : null}
          <OutlineButton
            className={styles.module_button}
            onClick={handleAddOrRemove}
          >
            {addRemoveText}
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}
