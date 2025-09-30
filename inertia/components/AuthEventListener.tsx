import { useEffect } from 'react'
import api from '~/api'

const AuthEventListener = ({
  debug = false,
  originMatch,
}: {
  debug?: boolean
  originMatch?: string
}) => {
  useEffect(() => {
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  async function handleMessage(event: MessageEvent) {
    console.log('Received message from parent window: ', event)
    if (originMatch && event.origin !== originMatch) {
      console.error(`Origin ${event.origin} does not match expected value: ${originMatch}`)
    }

    if (event.data.type !== 'AUTH_TOKEN') return
    const token = event.data.token

    if (debug) console.log('Received token from parent window: ', token)

    const success = await api.adaptLogin(token).catch((err) => {
      console.error('Adapt login error:', err)
      return false
    })
    if (success) {
      window.location.href = '/' // Redirect to home page after successful login
    }
  }

  return null // This component does not render anything
}

export default AuthEventListener
