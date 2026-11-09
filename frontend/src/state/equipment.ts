import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import { equipmentApi, errorMessage, requestOptions, statusOf, unavailable, withMediaProxy } from '../api/client'
import type { Equipment } from '../api/generated/Api'
import { mockEquipment } from '../api/mockEquipment'
import { signedIn, signedOut } from './session'

const equipmentThunk = createAsyncThunk.withTypes<{
  state: { auth: { login: string | null } }
  rejectValue: string
}>()

export const loadHeatingTiles = equipmentThunk('heatingEquipment/loadTiles',
  async (power: string, { getState, rejectWithValue, signal }) => {
    const login = getState().auth.login
    try {
      const query = power === '' ? {} : { min_power: Number(power) }
      const response = await equipmentApi.heatingEquipmentList(query, { ...requestOptions(login), signal })
      return { items: response.data.map(withMediaProxy), mock: false }
    } catch (error) {
      if (!login && unavailable(error) && !signal.aborted) {
        return { items: mockEquipment.filter(item => item.power >= Number(power)), mock: true }
      }
      return rejectWithValue(errorMessage(error))
    }
  })

export const loadHeatingFeed = equipmentThunk('heatingEquipment/loadFeed',
  async (after: number | undefined, { getState, rejectWithValue, signal }) => {
    const login = getState().auth.login
    const options = { ...requestOptions(login), signal }
    try {
      const response = after === undefined
        ? await equipmentApi.heatingEquipmentFeed(options)
        : await equipmentApi.heatingEquipmentFeedById(after, { next: true }, options)
      return { item: withMediaProxy(response.data), mock: false }
    } catch (error) {
      if (statusOf(error) === 404) return { item: null, mock: false }
      if (!login && unavailable(error) && !signal.aborted) {
        const index = mockEquipment.findIndex(item => item.id === after)
        return { item: mockEquipment[(index + 1) % mockEquipment.length], mock: true }
      }
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
  draftChecked: false, mock: false, pending: 0, error: '',
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
        state.mock = payload.mock
      })
      .addCase(loadHeatingFeed.fulfilled, (state, { payload }) => {
        state.feed = payload.item
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
