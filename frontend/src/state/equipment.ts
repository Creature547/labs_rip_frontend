import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import { equipmentApi, errorMessage, requestOptions, statusOf, unavailable, withMediaProxy } from '../api/client'
import type { Equipment } from '../api/generated/Api'
import { mockEquipment } from '../api/mockEquipment'
import { signedIn, signedOut, type EquipmentSort } from './session'

const equipmentThunk = createAsyncThunk.withTypes<{
  state: { auth: { login: string | null } }
  rejectValue: string
}>()

export const equipmentPageSize = 12
type TilesQuery = { power: string; page: number; sort: EquipmentSort }
type FeedQuery = { position: number; after?: number }

function mockTiles({ power, page, sort }: TilesQuery) {
  const items = mockEquipment.filter(item => item.power >= Number(power))
    .sort((a, b) => {
      if (sort === 'power') return a.power - b.power || a.id - b.id
      return (sort === 'price' ? a.cost - b.cost : 0) || b.id - a.id
    })
  return { items: items.slice((page - 1) * equipmentPageSize, page * equipmentPageSize), total: items.length, mock: true }
}

function mockFeed({ position, after }: FeedQuery) {
  const index = mockEquipment.findIndex(item => item.id === after)
  return { item: mockEquipment[(index + 1) % mockEquipment.length], position, mock: true }
}

function feedSession() {
  const stored = sessionStorage.getItem('heating_feed_session')
  if (stored) return stored
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
  sessionStorage.setItem('heating_feed_session', id)
  return id
}

export const loadHeatingTiles = equipmentThunk('heatingEquipment/loadTiles',
  async (query: TilesQuery, { getState, rejectWithValue, signal }) => {
    if (import.meta.env.MODE === 'pages') return mockTiles(query)
    const login = getState().auth.login
    try {
      const response = await equipmentApi.heatingEquipmentList({
        min_power: query.power === '' ? undefined : Number(query.power),
        page: query.page, limit: equipmentPageSize, sort: query.sort,
      }, { ...requestOptions(login), signal })
      return { items: response.data.data.map(withMediaProxy), total: response.data.total, mock: false }
    } catch (error) {
      if (!login && unavailable(error) && !signal.aborted) return mockTiles(query)
      return rejectWithValue(errorMessage(error))
    }
  })

export const loadHeatingFeed = equipmentThunk('heatingEquipment/loadFeed',
  async (query: FeedQuery, { getState, rejectWithValue, signal }) => {
    const login = getState().auth.login
    if (import.meta.env.MODE === 'pages') return mockFeed(query)
    try {
      const { data } = await equipmentApi.heatingEquipmentSessionFeed(
        { session: feedSession(), position: query.position },
        { ...requestOptions(login), signal },
      )
      return { item: withMediaProxy(data.item), position: data.position, mock: false }
    } catch (error) {
      if (statusOf(error) === 404) return { item: null, position: query.position, mock: false }
      if (!login && unavailable(error) && !signal.aborted) return mockFeed(query)
      return rejectWithValue(errorMessage(error))
    }
  })

export const loadHeatingDraft = equipmentThunk('heatingEquipment/loadDraft',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = await equipmentApi.heatingEquipmentDraft(requestOptions(getState().auth.login))
      return withMediaProxy(data)
    } catch (error) {
      if (statusOf(error) === 404) return null
      return rejectWithValue(errorMessage(error))
    }
  })

export type DraftFields = Parameters<typeof equipmentApi.heatingEquipmentCreateDraft>[0]

export const createHeatingDraft = equipmentThunk('heatingEquipment/createDraft',
  async (fields: DraftFields, { getState, rejectWithValue }) => {
    try {
      const { data } = await equipmentApi.heatingEquipmentCreateDraft(fields, requestOptions(getState().auth.login))
      return withMediaProxy(data)
    } catch (error) { return rejectWithValue(errorMessage(error)) }
  })

export const publishHeatingEquipment = equipmentThunk('heatingEquipment/publish',
  async (id: number, { getState, rejectWithValue }) => {
    try { await equipmentApi.heatingEquipmentPublish(id, requestOptions(getState().auth.login)) }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  })

export const likeHeatingEquipment = equipmentThunk('heatingEquipment/like',
  async (item: Equipment, { getState, rejectWithValue }) => {
    try {
      const { data } = await equipmentApi.heatingEquipmentLike(item.id, { like: item.liked ? 0 : 1 }, requestOptions(getState().auth.login))
      return withMediaProxy(data)
    } catch (error) { return rejectWithValue(errorMessage(error)) }
  })

export const deleteHeatingEquipment = equipmentThunk('heatingEquipment/delete',
  async (id: number, { getState, rejectWithValue }) => {
    try { await equipmentApi.heatingEquipmentDelete(id, requestOptions(getState().auth.login)); return id }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  })

const initialState = {
  tiles: [] as Equipment[], feed: null as Equipment | null, draft: null as Equipment | null,
  total: 0, feedPosition: 1, draftChecked: false, mock: false, pending: 0, error: '',
}
const requests = [loadHeatingTiles, loadHeatingFeed, loadHeatingDraft, createHeatingDraft,
  publishHeatingEquipment, likeHeatingEquipment, deleteHeatingEquipment] as const

export const equipmentSlice = createSlice({
  name: 'heatingEquipment', initialState,
  reducers: { clearError(state) { state.error = '' } },
  extraReducers: builder => {
    builder
      .addCase(signedIn, () => initialState)
      .addCase(signedOut, () => initialState)
      .addCase(loadHeatingTiles.fulfilled, (state, { payload }) => {
        state.tiles = payload.items
        state.total = payload.total
        state.mock = payload.mock
      })
      .addCase(loadHeatingFeed.fulfilled, (state, { payload }) => {
        state.feed = payload.item
        state.feedPosition = payload.position
        state.mock = payload.mock
      })
      .addCase(loadHeatingDraft.pending, state => { state.draftChecked = false })
      .addCase(loadHeatingDraft.fulfilled, (state, { payload }) => { state.draft = payload; state.draftChecked = true })
      .addCase(createHeatingDraft.fulfilled, (state, { payload }) => { state.draft = payload })
      .addCase(publishHeatingEquipment.fulfilled, state => { state.draft = null })
      .addCase(likeHeatingEquipment.fulfilled, (state, { payload }) => { state.feed = payload })
      .addCase(deleteHeatingEquipment.fulfilled, (state, { payload: id }) => {
        state.tiles = state.tiles.filter(item => item.id !== id)
        if (state.draft?.id === id) state.draft = null
      })
      .addMatcher(isAnyOf(...requests.map(request => request.pending)), state => {
        state.pending += 1
        state.error = ''
      })
      .addMatcher(isAnyOf(...requests.map(request => request.fulfilled), ...requests.map(request => request.rejected)), state => {
        state.pending = Math.max(0, state.pending - 1)
      })
      .addMatcher(isAnyOf(...requests.map(request => request.rejected)), (state, action) => {
        if (!action.meta.aborted) state.error = action.payload ?? 'Ошибка запроса.'
      })
  },
})
