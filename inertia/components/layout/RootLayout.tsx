import '../../css/app.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import Providers from '../Providers'
import NavMenu from '~/components/layout/NavMenu'
import DemoModeControls from '~/components/DemoModeControls'
import SessionToContextProvider from '~/components/SessionToContextProvider'
import IFrameResizer from '../IFrameResizer'
import AuthEventListener from '../AuthEventListener'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <IFrameResizer />
      <Providers>
        <AuthEventListener debug={true} originMatch={'https://adapt.libretexts.org'} />
        <SessionToContextProvider>
          <div className="tw:flex tw:flex-row tw:items-center tw:justify-center">
            {import.meta.env.VITE_DEMO_MODE === 'true' && <DemoModeControls />}
          </div>
          <div className="tw:grid tw:grid-flow-col tw:gap-6 tw:grid-cols-[208px_auto]">
            <NavMenu />
            {children}
          </div>
        </SessionToContextProvider>
      </Providers>
    </>
  )
}
