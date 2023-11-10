import * as React from 'react'
import styled from 'styled-components'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  LabeledValue,
  SPACING,
  Box,
  TYPOGRAPHY,
  DIRECTION_ROW,
} from '@opentrons/components'
import { getCutoutDisplayName } from '@opentrons/shared-data'
import { i18n } from '../../localization'
import stagingAreaImage from '../../images/staging_area.png'
import { getStagingAreaSlots } from '../../utils'
import { Portal } from '../portals/TopPortal'
import { StagingAreasModal } from './StagingAreasModal'
import { FlexSlotMap } from './FlexSlotMap'

import styles from './styles.css'
import type { Cutout } from '@opentrons/shared-data'
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'

interface StagingAreasRowProps {
  handleAttachment: () => void
  stagingAreas: AdditionalEquipmentEntity[]
}

export function StagingAreasRow(props: StagingAreasRowProps): JSX.Element {
  const { handleAttachment, stagingAreas } = props
  const hasStagingAreas = stagingAreas.length > 0
  const [stagingAreaModal, openStagingAreaModal] = React.useState<boolean>(
    false
  )
  const stagingAreaLocations = getStagingAreaSlots(stagingAreas)

  return (
    <>
      {stagingAreaModal ? (
        <Portal>
          <StagingAreasModal
            onCloseClick={() => openStagingAreaModal(false)}
            stagingAreas={stagingAreas}
          />
        </Portal>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>
          {i18n.t(`modules.additional_equipment_display_names.stagingAreas`)}
        </h4>

        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <StagingAreaImage
            src={stagingAreaImage}
            alt={i18n.t(
              `modules.additional_equipment_display_names.stagingAreas`
            )}
          />
          <div
            className={styles.module_col}
            style={{ marginLeft: SPACING.spacing32 }}
          />
          {hasStagingAreas && stagingAreaLocations != null ? (
            <>
              <div className={styles.module_col}>
                <LabeledValue
                  label="Position"
                  value={`${stagingAreaLocations.map(location =>
                    getCutoutDisplayName(location as Cutout)
                  )}`}
                />
              </div>

              <div className={styles.slot_map}>
                <FlexSlotMap selectedSlots={stagingAreaLocations ?? []} />
              </div>
            </>
          ) : null}
          <Box
            flexDirection={DIRECTION_ROW}
            flex="1 0 40%"
            textAlign={TYPOGRAPHY.textAlignRight}
          >
            {hasStagingAreas ? (
              <OutlineButton
                onClick={() => openStagingAreaModal(true)}
                className={styles.module_button}
              >
                {i18n.t('shared.edit')}
              </OutlineButton>
            ) : null}
            <Box
              width="6.75rem"
              display="inline-block"
              marginRight={SPACING.spacing16}
            >
              <OutlineButton
                className={styles.module_button}
                onClick={
                  hasStagingAreas
                    ? handleAttachment
                    : () => openStagingAreaModal(true)
                }
              >
                {hasStagingAreas
                  ? i18n.t('shared.remove')
                  : i18n.t('shared.add')}
              </OutlineButton>
            </Box>
          </Box>
        </Flex>
      </Flex>
    </>
  )
}

const StagingAreaImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
