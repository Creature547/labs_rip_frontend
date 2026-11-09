import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { store } from './state/store'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}><App /></Provider>
  </StrictMode>,
)
