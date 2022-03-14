import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { MenuList } from '../../atoms/MenuList'
import { StyleProps } from '@opentrons/components'

interface ProtocolOverflowMenuProps extends StyleProps {
  handleRunProtocol: () => void
}

export function ProtocolOverflowMenu(props: ProtocolOverflowMenuProps): JSX.Element {
  const {handleRunProtocol} = props
  const { t } = useTranslation('protocol_list')
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const handleDelete = () => {
    console.log('TODO: handle delete')
  }
  return (
    <>
      <OverflowBtn onClick={() => setShowOverflowMenu(!showOverflowMenu)} />
      {showOverflowMenu ? (
        <MenuList
          buttons={[
            <MenuItem onClick={handleRunProtocol}>{t('run')}</MenuItem>,
            <MenuItem onClick={handleDelete}>{t('delete_protocol')}</MenuItem>,
          ]}
        />
      ) : null}
    </>
  )
}
