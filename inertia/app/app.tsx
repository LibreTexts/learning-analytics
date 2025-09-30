/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createRoot } from 'react-dom/client'
import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import RootLayout from '~/components/layout/RootLayout'

const appName = import.meta.env.VITE_APP_NAME || 'ADAPT Learning Analytics'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    const page: any = await resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob('../pages/**/*.tsx')
    )
    page.default.layout = page.default.layout || ((page: any) => <RootLayout>{page}</RootLayout>)
    return page
  },

  setup({ el, App, props }) {
    el.classList.add('mt-4')
    createRoot(el).render(<App {...props} />)
  },
})
