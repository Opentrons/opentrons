import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { COLORS } from '@opentrons/components'

import { OddModal } from '/app/molecules/OddModal'
import { ActionList } from '/app/organisms/ActionItems/ActionList'

import type { IconName } from '@opentrons/components'
import type { DocumentedAction } from '@opentrons/react-api-client'

const ActionsViewImpl = ({
  actionsToDocument,
}: {
  actionsToDocument: DocumentedAction[]
}): JSX.Element => {
  const { t } = useTranslation(['access_control', 'shared'])
  const modal = useModal()
  const actionViewHeader = {
    title: t('actions_requiring_documentation'),
    hasExitIcon: true,
    iconName: 'information' as IconName,
    iconColor: COLORS.black90,
    onClick: modal.remove,
  }
  return (
    <OddModal
      header={actionViewHeader}
      modalZIndex={1002}
      onOutsideClick={modal.remove}
    >
      <ActionList actionsToDocument={actionsToDocument} />
    </OddModal>
  )
}

export const ActionsView = NiceModal.create(ActionsViewImpl)
