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

if (import.meta.env.MODE === 'pages' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js')
      .catch(error => console.error('Ошибка установки PWA', error))
  })
}
