import * as React from 'react'

import '../css/reset.css'
import { RouterProvider } from 'react-router-dom'
import { router } from '../flex-components'

export function App(): JSX.Element {
  return (
    <div className="container">
      <RouterProvider router={router} />
    </div>
  )
}
