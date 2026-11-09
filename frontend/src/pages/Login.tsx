import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'

export function Login({ onLogin }: { onLogin: (login: string, password: string) => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  return <section className="form-page">
    <h1>Вход</h1>
    <Form onSubmit={event => { event.preventDefault(); onLogin(login.trim(), password) }}>
      <Form.Group controlId="login"><Form.Label>Логин</Form.Label>
        <Form.Control required autoComplete="username" value={login} onChange={e => setLogin(e.target.value)} /></Form.Group>
      <Form.Group controlId="password"><Form.Label>Пароль</Form.Label>
        <Form.Control required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></Form.Group>
      <Button type="submit">Войти</Button>
    </Form>
  </section>
}
