import * as React from 'react'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import {
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  ListItem,
  ListItemCustomize,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { WizardBody } from './WizardBody'
import { AdditionalEquipmentDiagram } from './utils'

import type { AdditionalEquipment, WizardTileProps } from './types'

const ADDITIONAL_EQUIPMENT: AdditionalEquipment[] = [
  'wasteChute',
  'trashBin',
  'stagingArea_cutoutA3',
  'stagingArea_cutoutB3',
  'stagingArea_cutoutC3',
  'stagingArea_cutoutD3',
]
export function SelectFixtures(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, setValue, watch } = props
  const additionalEquipment = watch('additionalEquipment')
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const filteredAdditionalEquipmentWithoutGripper = additionalEquipment.filter(
    ae => ae !== 'gripper'
  )
  const filteredAdditionalEquipment = ADDITIONAL_EQUIPMENT.filter(
    equipment => !filteredAdditionalEquipmentWithoutGripper.includes(equipment)
  )

  return (
    <WizardBody
      stepNumber={5}
      header={t('add_fixtures')}
      disabled={false}
      goBack={() => {
        goBack(1)
      }}
      proceed={() => {
        proceed(1)
      }}
    >
      <Flex marginTop={SPACING.spacing60} flexDirection={DIRECTION_COLUMN}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="headingSmallBold"
            marginBottom={SPACING.spacing12}
          >
            {t('which_fixtures')}
          </StyledText>
        </Flex>
        <Flex gridGap={SPACING.spacing4} flexWrap="wrap">
          {filteredAdditionalEquipment.map(equipment => (
            <EmptySelectorButton
              key={equipment}
              textAlignment="left"
              size="small"
              iconName="plus"
              text={t(`${equipment}`)}
              onClick={() => {
                setValue('additionalEquipment', [
                  ...additionalEquipment,
                  equipment,
                ])
              }}
            />
          ))}
        </Flex>
        <Flex marginTop={SPACING.spacing32} flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="headingSmallBold"
            marginBottom={SPACING.spacing12}
          >
            {t('fixtures_added')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {filteredAdditionalEquipmentWithoutGripper.map(ae => (
              <ListItem type="noActive" key={ae}>
                <ListItemCustomize
                  linkText={t('remove')}
                  onClick={() => {
                    setValue(
                      'additionalEquipment',
                      without(additionalEquipment, ae)
                    )
                  }}
                  header={t(`${ae}`)}
                  image={
                    <AdditionalEquipmentDiagram additionalEquipment={ae} />
                  }
                />
              </ListItem>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </WizardBody>
  )
}
