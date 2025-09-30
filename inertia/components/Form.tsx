import { ActionResult } from '#types/misc'
import { useActionState } from 'react'

export function Form({
  children,
  action,
}: {
  children: React.ReactNode
  action: (prevState: any, formData: FormData) => Promise<ActionResult>
}) {
  const [state, formAction] = useActionState(action, {
    error: null,
  })
  return (
    <form action={formAction}>
      {children}
      <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>{state.error}</p>
    </form>
  )
}
