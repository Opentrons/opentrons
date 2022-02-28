import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  Text,
  DIRECTION_ROW,
  Icon,
  TYPOGRAPHY,
  SPACING,
  Box,
  RobotWorkSpace,
  C_SELECTED_DARK,
} from '@opentrons/components'
import attachHeaterShakerModule from '../../../assets/images/heater_shaker_module_diagram.svg'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import screwdriverOrientedLeft from '../../../assets/images/screwdriver_oriented_left.svg'

interface AttachModuleProps {
  slotName?: string
}

export function AttachModule(props: AttachModuleProps): JSX.Element {
  const { slotName } = props
  const { t } = useTranslation('heater_shaker')
  const DECK_MAP_VIEWBOX = '-80 -20 550 460'
  const DECK_LAYER_BLOCKLIST = [
    'calibrationMarkings',
    'fixedBase',
    'doorStops',
    'metalFrame',
    'removalHandle',
    'removableDeckOutline',
    'screwHoles',
  ]

  return (
    <Flex
      color={COLORS.darkBlack}
      flexDirection={DIRECTION_COLUMN}
      fontSize={TYPOGRAPHY.fontSizeH2}
    >
      <Text paddingBottom={SPACING.spacingL} fontWeight={700}>
        {t('step_1_of_4_attach_module')}
      </Text>
      <AttachedModuleItem step={t('1a')}>
        <Flex flexDirection={DIRECTION_ROW} marginLeft={SPACING.spacingXL}>
          {/* TODO(sh, 2022-02-18): replace this image with the final version from design */}
          <img src={attachHeaterShakerModule} alt="Attach Module to Deck" />
          <img src={screwdriverOrientedLeft} alt="screwdriver_1a" />
          <Flex
            marginLeft={SPACING.spacingXL}
            marginTop={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
          >
            <Trans
              t={t}
              i18nKey={'attach_module_anchor_not_extended'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={'attach_module_turn_screws'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
                icon: <Icon name="counter-clockwise-arrow" size={'1.313rem'} />,
              }}
            />
          </Flex>
        </Flex>
      </AttachedModuleItem>
      <AttachedModuleItem step={t('1b')}>
        <Flex flexDirection={DIRECTION_ROW} marginX={SPACING.spacing4}>
          <Box
            width="60%"
            padding={SPACING.spacing3}
            data-testid={'HeaterShakerWizard_deckMap'}
          >
            {/* TODO(sh, 2022-02-18): Dynamically render the heater shaker module in the correct slot number. */}
            {slotName != null ? (
              <RobotWorkSpace
                deckDef={standardDeckDef as any}
                viewBox={DECK_MAP_VIEWBOX}
                deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
                id={'HeaterShakerWizard_deckMap'}
              >
                {() => (
                  <>
                    <g>
                      <rect
                        width={127.75 - 2}
                        height={85.5 - 2}
                        fill={'none'}
                        stroke={C_SELECTED_DARK}
                        strokeWidth={'3px'}
                      />
                    </g>
                  </>
                )}
              </RobotWorkSpace>
            ) : (
              <RobotWorkSpace
                deckDef={standardDeckDef as any}
                viewBox={DECK_MAP_VIEWBOX}
                deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
                id={'HeaterShakerWizard_deckMap'}
              ></RobotWorkSpace>
            )}
          </Box>
          <img src={screwdriverOrientedLeft} alt="screwdriver_1b" />
          <Flex
            marginLeft={SPACING.spacing4}
            marginTop={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
          >
            <Trans
              t={t}
              i18nKey={'orient_heater_shaker_module'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={
                slotName != null
                  ? 'place_the_module_slot_number'
                  : 'place_the_module_slot'
              }
              values={{ slot: slotName }}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
              }}
            />
            <Trans
              t={t}
              i18nKey={'attach_module_extend_anchors'}
              components={{
                bold: <strong />,
                block: (
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeH2}
                    marginBottom={SPACING.spacing5}
                  />
                ),
                icon: <Icon name="counter-clockwise-arrow" size={'1.313rem'} />,
              }}
            />
          </Flex>
        </Flex>
      </AttachedModuleItem>
      <AttachedModuleItem step={t('1c')}>
        <Text fontSize={TYPOGRAPHY.fontSizeH2}>
          {t('attach_module_check_attachment')}
        </Text>
      </AttachedModuleItem>
    </Flex>
  )
}

interface AttachedModuleItemProps {
  step: string
  children?: React.ReactNode
}

function AttachedModuleItem(props: AttachedModuleItemProps): JSX.Element {
  const { step } = props
  return (
    <Flex flexDirection={DIRECTION_ROW} marginTop={'0.625rem'}>
      <Text
        color={COLORS.darkGrey}
        paddingRight={SPACING.spacing4}
        data-testid={`attach_module_${step}`}
      >
        {step}
      </Text>
      <Flex
        border={`${SPACING.spacingXXS} solid ${COLORS.medGrey}`}
        flexDirection={DIRECTION_COLUMN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        padding={`${SPACING.spacing4} ${SPACING.spacingM} ${SPACING.spacingM} ${SPACING.spacing4}`}
        width="100%"
        marginBottom={SPACING.spacing4}
      >
        {props.children}
      </Flex>
    </Flex>
  )
}
