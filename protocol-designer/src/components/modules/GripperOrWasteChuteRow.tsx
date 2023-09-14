import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  LabeledValue,
  SPACING,
  SlotMap,
} from '@opentrons/components'
import gripperImage from '../../images/flex_gripper.svg'
import styles from './styles.css'

interface GripperOrWasteChuteRowProps {
  handleAttachment: () => void
  isEquipmentAdded: boolean
  name: 'gripper' | 'wasteChute'
}

export function GripperOrWasteChuteRow(
  props: GripperOrWasteChuteRowProps
): JSX.Element {
  const { handleAttachment, isEquipmentAdded, name } = props
  const { i18n, t } = useTranslation()

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>
          {name === 'gripper' ? 'Flex Gripper' : 'Waste Chute'}
        </h4>
        <AdditionalItemImage
          src={gripperImage}
          alt={name === 'gripper' ? 'Flex Gripper' : 'Waste Chute'}
        />
      </Flex>
      <div
        className={styles.module_col}
        style={{ marginLeft: SPACING.spacing32 }}
      >
        {isEquipmentAdded && name === 'gripper' ? (
          <LabeledValue
            label="Model"
            value={i18n.t(`modules.model_display_name.gripperV1`)}
          />
        ) : null}
      </div>
      <div className={styles.slot_map}>
        {name === 'wasteChute' && isEquipmentAdded ? (
          <SlotMap
            occupiedSlots={['D3']}
            collisionSlots={[]}
            robotType={FLEX_ROBOT_TYPE}
          />
        ) : null}
      </div>
      <div
        className={styles.modules_button_group}
        style={{ alignSelf: ALIGN_CENTER }}
      >
        <OutlineButton
          className={styles.module_button}
          onClick={handleAttachment}
        >
          {isEquipmentAdded
            ? i18n.format(t('shared.remove'), 'capitalize')
            : i18n.format(t('shared.add'), 'capitalize')}
        </OutlineButton>
      </div>
    </Flex>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
