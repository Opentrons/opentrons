import * as React from 'react'
import { KitchenContext } from './KitchenContext'
import type { KitchenContextType } from './KitchenContext'

export function useKitchen(): KitchenContextType {
  const { eatToast, bakeToast, makeSnackbar } = React.useContext(KitchenContext)

  return { eatToast, bakeToast, makeSnackbar }
}
