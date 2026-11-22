
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import { authApi, errorMessage, requestOptions, statusOf, tokenKey } from '../api/client'
import { signedIn, signedOut } from '../state/session'
import { useAppDispatch, useAppSelector } from '../state/store'

type AuthCallbacks = {
  onSuccess: () => void
  onBusyChange: (busy: boolean) => void
  onError: (error: string) => void
}

// Страница авторизации пользователя
export function Login({ onSuccess, onBusyChange, onError }: AuthCallbacks) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useAppDispatch()

  async function handleLogin() {
    const username = login.trim()
    if (!username || !password) return

    onBusyChange(true)
    onError('')

    try {
      const { data } = await authApi.post('/auth', {
        login: username,
        password,
      })

      if (typeof data.access_token !== 'string' || !data.access_token) {
        throw new Error('JWT отсутствует')
      }

      localStorage.setItem(tokenKey, data.access_token)
      dispatch(signedIn(data.user?.login ?? username))
      onSuccess()
    } catch (failure) {
      onError(errorMessage(failure))
    } finally {
      onBusyChange(false)
    }
  }

  return (
    <section className="form-page">
      <h1>Вход</h1>

      <Form
        onSubmit={(event) => {
          event.preventDefault()
          void handleLogin()
        }}
      >
        <Form.Group controlId="login">
          <Form.Label>Логин</Form.Label>
          <Form.Control
            required
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="password">
          <Form.Label>Пароль</Form.Label>
          <Form.Control
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Form.Group>

        <Button type="submit">Войти</Button>
      </Form>
    </section>
  )
}

// Выход пользователя из системы
export function LogoutButton({ onSuccess, onBusyChange, onError }: AuthCallbacks) {
  const dispatch = useAppDispatch()
  const login = useAppSelector((state) => state.auth.login)

  async function handleLogout() {
    onBusyChange(true)
    onError('')

    try {
      await authApi.post('/logout', null, requestOptions(login))
    } catch (failure) {
      if (statusOf(failure) !== 401) {
        onError(errorMessage(failure))
        return
      }
    } finally {
      onBusyChange(false)
    }

    localStorage.removeItem(tokenKey)
    dispatch(signedOut())
    onSuccess()
  }

  return (
    <Button
      variant="link"
      className="nav-item"
      onClick={() => void handleLogout()}
    >
      <span aria-hidden="true" className="nav-icon">⇥</span>
      <span>Выход</span>
    </Button>
  )
}
