import axios from 'axios'
import { Api } from './generated/Api'
import type { Equipment } from './generated/Api'

export const equipmentApi = new Api({ baseURL: '/api', timeout: 60000 }).heatingEquipment
export const authApi = axios.create({ baseURL: '/api/users', timeout: 10000 })
export const tokenKey = 'access_token'

export function requestOptions(login: string | null) {
  const token = login && localStorage.getItem(tokenKey)
  return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

export function statusOf(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined
}

export function unavailable(error: unknown) {
  return axios.isAxiosError(error) &&
    (!error.response || [502, 504].includes(error.response.status))
}

export function errorMessage(error: unknown) {
  if (unavailable(error)) return 'Нет связи с Go-сервисом. Проверь запуск бэкенда и повтори запрос.'
  switch (statusOf(error)) {
    case 400: return 'Сервер отклонил данные. Проверь поля и формат файлов.'
    case 401: return 'Требуется вход. Проверь логин и пароль или войди заново.'
    case 404: return 'Прибор не найден. Обнови страницу со списком.'
    case 409: return 'У тебя уже есть черновик. Открой «Добавление» ещё раз.'
    case 503: return 'Сервис временно недоступен. Проверь Redis и повтори запрос.'
    default: return 'Запрос завершился ошибкой. Проверь бэкенд и повтори попытку.'
  }
}

// The Go serializer returns the MinIO origin and the bucket/object pathname.
export function withMediaProxy(item: Equipment): Equipment {
  const proxied = (url: string) => {
    if (!url) return ''
    const object = new URL(url, window.location.origin)
    return '/s3' + object.pathname + object.search
  }
  return { ...item, image_url: proxied(item.image_url), video_url: proxied(item.video_url) }
}
