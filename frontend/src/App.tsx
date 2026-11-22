import { useState } from 'react'
import { Button, Container, Navbar, Spinner } from 'react-bootstrap'
import { useAppDispatch, useAppSelector } from './state/store'
import { equipmentSlice } from './state/equipment'
import { AddEquipment } from './pages/AddEquipment'
import { Feed } from './pages/Feed'
import { Login, LogoutButton } from './pages/Login'
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

  const authCallbacks = {
    onBusyChange: setAuthBusy,
    onError: setAuthError,
  }

  return <div className="app-shell"><div className="phone-screen" aria-busy={busy}>
    <div className="screen-controls" inert={busy}>
      <main className="phone-content" key={page}>
        {(authError || error) && <div role="alert" className="request-error">{authError || error}</div>}
        {page === 'feed' && <Feed />}
        {page === 'tiles' && <Tiles />}
        {page === 'add' && login && <AddEquipment onPublished={() => navigate('tiles')} />}
        {page === 'login' && <Login {...authCallbacks} onSuccess={() => navigate('tiles')} />}
      </main>
      {!login && mock && (page === 'feed' || page === 'tiles') && <span className="mock-indicator">Демо · без сервера</span>}
      <Navbar className="bottom-nav"><Container className="justify-content-around px-0">
        {navigation.map(([next, icon, title]) => next === 'login' && login
          ? <LogoutButton key={next} {...authCallbacks} onSuccess={() => navigate('feed')} />
          : <Button key={next} variant="link"
              disabled={next === 'add' && !login} className={'nav-item' + (page === next ? ' active' : '')}
              onClick={() => navigate(next)}>
              <span aria-hidden="true" className="nav-icon">{icon}</span><span>{title}</span>
            </Button>)}
      </Container></Navbar>
    </div>
    {busy && <div className="loading-cover" role="status"><Spinner animation="border" /><span>Загрузка…</span></div>}
  </div></div>
}
