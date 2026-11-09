import { useState } from 'react'
import { Button, Container, Navbar, Spinner } from 'react-bootstrap'
import { authApi, errorMessage, requestOptions, statusOf, tokenKey } from './api/client'
import { useAppDispatch, useAppSelector } from './state/store'
import { signedIn, signedOut } from './state/session'
import { equipmentSlice } from './state/equipment'
import { AddEquipment } from './pages/AddEquipment'
import { Feed } from './pages/Feed'
import { Login } from './pages/Login'
import { Tiles } from './pages/Tiles'
import './App.css'

type Page = 'feed' | 'add' | 'tiles' | 'login'
const navigation = [
  ['feed', '◉', 'Лента'], ['add', '＋', 'Добавление'],
  ['tiles', '▦', 'Плитка'], ['login', '⇥', 'Вход'],
] as const

export default function App() {
  const [page, setPage] = useState<Page>('feed')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const dispatch = useAppDispatch()
  const login = useAppSelector(state => state.auth.login)
  const { pending, error, mock } = useAppSelector(state => state.heatingEquipment)
  const busy = authBusy || pending > 0
  function navigate(next: Page) {
    setAuthError('')
    dispatch(equipmentSlice.actions.clearError())
    setPage(next)
  }
  async function signIn(username: string, password: string) {
    setAuthBusy(true)
    setAuthError('')
    try {
      const { data } = await authApi.post('/auth', { login: username, password })
      if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('JWT отсутствует')
      localStorage.setItem(tokenKey, data.access_token)
      dispatch(signedIn(data.user?.login ?? username))
      navigate('tiles')
    } catch (failure) { setAuthError(errorMessage(failure)) }
    finally { setAuthBusy(false) }
  }
  async function signOut() {
    setAuthBusy(true)
    setAuthError('')
    try { await authApi.post('/logout', null, requestOptions(login)) }
    catch (failure) {
      if (statusOf(failure) !== 401) { setAuthError(errorMessage(failure)); return }
    } finally { setAuthBusy(false) }
    localStorage.removeItem(tokenKey)
    dispatch(signedOut())
    navigate('feed')
  }
  return <div className="app-shell"><div className="phone-screen" aria-busy={busy}>
    <div className="screen-controls" inert={busy}>
      <main className="phone-content" key={page}>
        {(authError || error) && <div role="alert" className="request-error">{authError || error}</div>}
        {page === 'feed' && <Feed />}
        {page === 'tiles' && <Tiles />}
        {page === 'add' && login && <AddEquipment onPublished={() => navigate('tiles')} />}
        {page === 'login' && <Login onLogin={signIn} />}
      </main>
      {!login && mock && (page === 'feed' || page === 'tiles') && <span className="mock-indicator">Демо · без сервера</span>}
      <Navbar className="bottom-nav"><Container className="justify-content-around px-0">
        {navigation.map(([next, icon, title]) => <Button key={next} variant="link"
          disabled={next === 'add' && !login} className={'nav-item' + (page === next ? ' active' : '')}
          onClick={() => next === 'login' && login ? void signOut() : navigate(next)}>
          <span aria-hidden="true" className="nav-icon">{icon}</span><span>{next === 'login' && login ? 'Выход' : title}</span>
        </Button>)}
      </Container></Navbar>
    </div>
    {busy && <div className="loading-cover" role="status"><Spinner animation="border" /><span>Загрузка…</span></div>}
  </div></div>
}
