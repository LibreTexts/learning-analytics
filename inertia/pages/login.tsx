import 'bootstrap/dist/css/bootstrap.css'
import { useState } from 'react'
import api from '~/api'

const INPUT_CLASSES = 'tw:mt-1 tw:rounded-md tw:border-slate-500'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    try {
      if (!email || !password) {
        alert('Please enter both email and password')
        return
      }

      await api.fallbackLogin(email, password)
      window.location.href = '/'
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:justify-center tw:items-center tw:align-center tw:w-full">
      <div className="!tw:border !tw:border-black tw:bg-white !tw:px-8 !tw:py-6 tw:rounded-md tw:shadow-md">
        <h1 className="tw:text-center">Sign in</h1>
        <div className="tw:flex tw:flex-col">
          <label htmlFor="email">Email</label>
          <input
            name="email"
            id="email"
            className={INPUT_CLASSES}
            placeholder="johndoe@mail.com"
            maxLength={31}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="******"
            className={INPUT_CLASSES}
            maxLength={255}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br />
          <button
            className="tw:bg-libre-blue tw:text-white tw:rounded-md tw:border-none tw:shadow-md"
            onClick={(e) => {
              e.preventDefault()
              handleLogin()
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
