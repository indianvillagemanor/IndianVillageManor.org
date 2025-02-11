import GridSection from '@/components/grid_section'
import { Gurajada } from 'next/font/google'
import React from 'react'

const LoginPage = () => {
  return (
    <div>
      <form>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
      <div>
        <button
        // onClick={() => alert('Magic link sent to your email!')}
        >Send Magic Link</button>
      </div>
      <div>
        <button
        // onClick={() => window.location.href = '/register'}
        >Go to Registration</button>
      </div>
    </div>
  )
}

export default LoginPage
