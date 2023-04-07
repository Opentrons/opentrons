import * as React from 'react'

import '../css/reset.css'

import { createBrowserRouter } from 'react-router-dom'
import { ProtocolEditor } from '../components/ProtocolEditor'
import { FlexForm } from './FlexForm'
import { LandingPage } from './LandingPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: 'ot-flex',
    element: <FlexForm />,
  },
  {
    path: 'ot-2',
    element: <ProtocolEditor />,
  },
])
