"use client";

import { useFormState } from "react-dom";

export function Form({
  children,
  action,
}: {
  children: React.ReactNode;
  action: (prevState: any, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction] = useFormState(action, {
    error: null,
  });
  return (
    <form action={formAction}>
      {children}
      <p style={{ color: "red", textAlign: 'center', marginTop: '10px' }}>{state.error}</p>
    </form>
  );
}

export interface ActionResult {
  error: string | null;
}
