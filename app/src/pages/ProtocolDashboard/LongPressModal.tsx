import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Flex, Icon, SPACING } from '@opentrons/components'
import { useCreateRunMutation } from '@opentrons/react-api-client'

import { MAXIMUM_PINNED_PROTOCOLS } from '../../App/constants'
import { StyledText } from '../../atoms/text'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { SmallModalChildren } from '../../molecules/Modal/OnDeviceDisplay'
import { useToaster } from '../../organisms/ToasterOven'
import { getPinnedProtocolIds, updateConfigValue } from '../../redux/config'

import type { UseLongPressResult } from '@opentrons/components'
import type { Dispatch } from '../../redux/types'

interface LongPressModalProps {
  longpress: UseLongPressResult
  protocolId: string
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
}

export function LongPressModal({
  longpress,
  protocolId,
  setShowDeleteConfirmationModal,
}: LongPressModalProps): JSX.Element {
  const history = useHistory()
  let pinnedProtocolIds = useSelector(getPinnedProtocolIds) ?? []
  const { t } = useTranslation(['protocol_info', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const { makeSnackbar } = useToaster()

  const pinned = pinnedProtocolIds.includes(protocolId)

  const [showMaxPinsAlert, setShowMaxPinsAlert] = React.useState<boolean>(false)

  // This looks totally bonkers, and it is. This construction is to make
  // it easier to use in unit tests, where we have to mock both the mutation
  // and the createRun function. The real code didn't like the mock:
  //
  // TypeError: Cannot read properties of undefined (reading 'createRun')
  //
  // Having the empty function fallback lets the mocks get called. In real use it
  // shouldn't ever get needed.
  const createRunUse = useCreateRunMutation({
    onSuccess: data => {
      const runId: string = data.data.id
      history.push(`/runs/${runId}/setup`)
    },
  })
  const createRun =
    createRunUse?.createRun !== undefined ? createRunUse.createRun : () => {}

  const handleCloseModal = (): void => {
    longpress.setIsLongPressed(false)
  }

  const handleDeleteClick = (): void => {
    setShowDeleteConfirmationModal(true)
    longpress.setIsLongPressed(false)
  }

  const handlePinClick = (): void => {
    if (!pinned) {
      if (pinnedProtocolIds.length === MAXIMUM_PINNED_PROTOCOLS) {
        setShowMaxPinsAlert(true)
      } else {
        pinnedProtocolIds.push(protocolId)
        handlePinnedProtocolIds(pinnedProtocolIds)
        makeSnackbar(t('pinned_protocol'))
      }
    } else {
      pinnedProtocolIds = pinnedProtocolIds.filter(p => p !== protocolId)
      handlePinnedProtocolIds(pinnedProtocolIds)
      makeSnackbar(t('unpinned_protocol'))
    }
  }

  const handleRunClick = (): void => {
    longpress.setIsLongPressed(false)
    createRun({ protocolId: protocolId })
  }

  const handlePinnedProtocolIds = (pinnedProtocolIds: string[]): void => {
    dispatch(
      updateConfigValue('protocols.pinnedProtocolIds', pinnedProtocolIds)
    )
    longpress.setIsLongPressed(false)
  }

  return (
    <>
      {showMaxPinsAlert ? (
        <SmallModalChildren
          header={t('too_many_pins_header')}
          subText={t('too_many_pins_body')}
          buttonText={t('shared:close')}
          handleCloseMaxPinsAlert={() => longpress?.setIsLongPressed(false)}
        />
      ) : (
        <MenuList onClick={handleCloseModal} isOnDevice={true}>
          <MenuItem onClick={handleRunClick} key="play-circle">
            <Flex>
              <Icon name="play-circle" size="1.75rem" />
              <StyledText marginLeft={SPACING.spacing24}>
                {t('run_protocol')}
              </StyledText>
            </Flex>
          </MenuItem>
          <MenuItem onClick={handlePinClick} key="pin">
            <Flex>
              <Icon name="pin" size="1.875rem" />
              <StyledText marginLeft={SPACING.spacing24}>
                {pinned ? t('unpin_protocol') : t('pin_protocol')}
              </StyledText>
            </Flex>
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} key="trash" isAlert={true}>
            <Flex>
              <Icon name="trash" size="1.875rem" />
              <StyledText marginLeft={SPACING.spacing24}>
                {t('delete_protocol')}
              </StyledText>
            </Flex>
          </MenuItem>
        </MenuList>
      )}
    </>
  )
}
