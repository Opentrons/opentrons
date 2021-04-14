// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  useHoverTooltip,
  Flex,
  Icon,
  ListItem,
  Text,
  TitledList,
  Tooltip,
  ALIGN_CENTER,
  C_MED_GRAY,
  FONT_SIZE_CAPTION,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  TEXT_TRANSFORM_UPPERCASE,
  Box,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { selectors as robotSelectors } from '../../redux/robot'
import { getMatchedModules, getMissingModules } from '../../redux/modules'
import styles from './styles.css'

import type { MatchedModule } from '../../redux/modules/types'
import type { State } from '../../redux/types'

const DECK_SLOT_STYLE = { width: '4.5rem' }
const MODULE_STYLE = { width: '7rem', paddingRight: SPACING_3 }
const USB_PORT_STYLE = { width: '3.5rem' }

export function ProtocolModuleList(): React.Node {
  const { t } = useTranslation('protocol_calibration')
  const modulesRequired = useSelector((state: State) =>
    robotSelectors.getModules(state)
  )
  const matched = useSelector((state: State) => getMatchedModules(state))
  const missingModules = useSelector((state: State) => getMissingModules(state))

  if (modulesRequired.length < 1) return null
  return (
    <TitledList key={t('modules_title')} title={t('modules_title')}>
      <Flex
        color={C_MED_GRAY}
        fontSize={FONT_SIZE_CAPTION}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        marginLeft="2.125rem"
        marginBottom={SPACING_2}
      >
        <Text {...DECK_SLOT_STYLE}>{t('modules_deck_slot_title')}</Text>
        <Text {...MODULE_STYLE}>{t('modules_module_title')}</Text>
        <Text {...USB_PORT_STYLE}>{t('modules_usb_port_title')}</Text>
      </Flex>
      <ListItem
        key={'module'}
        url={`/calibrate/modules`}
        className={styles.module_list_item}
        activeClassName={styles.active}
      >
        <Box>
          {modulesRequired.map(m => (
            <Flex
              key={m.slot}
              data-test={m.slot}
              alignItems={ALIGN_CENTER}
              padding="0.75rem"
            >
              <Flex width={'6rem'}>
                <Icon
                  name={
                    missingModules.includes(m)
                      ? 'checkbox-blank-circle-outline'
                      : 'check-circle'
                  }
                  width={'15px'}
                  marginRight={SPACING_2}
                />
                <Text {...DECK_SLOT_STYLE}>{`Slot ${m.slot}`}</Text>
              </Flex>
              <Flex {...MODULE_STYLE}>
                <Text>{getModuleDisplayName(m.model)}</Text>
              </Flex>
              <UsbPortInfo
                matchedModule={matched.find(a => a.slot === m.slot) || null}
              />
            </Flex>
          ))}
        </Box>
      </ListItem>
    </TitledList>
  )
}

type UsbPortInfoProps = {|
  matchedModule: MatchedModule | null,
|}

function UsbPortInfo(props: UsbPortInfoProps): React.Node {
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation('protocol_calibration')

  // return nothing if module is missing
  if (props.matchedModule === null) return null
  const portInfo = props.matchedModule.module.usbPort
  const portText = portInfo?.hub
    ? `Port ${portInfo.hub} via Hub`
    : portInfo?.port
    ? `Port ${portInfo.port}`
    : 'N/A'
  return (
    <>
      <Flex {...USB_PORT_STYLE}>
        <Text>{portText}</Text>
        {portText === 'N/A' && (
          <Flex {...targetProps}>
            <Icon name="alert-circle" width={'15px'} paddingLeft={SPACING_1} />
            <Tooltip style={{ width: '2rem' }} {...tooltipProps}>
              {t('modules_update_software_tooltip')}
            </Tooltip>
          </Flex>
        )}
      </Flex>
    </>
  )
}
