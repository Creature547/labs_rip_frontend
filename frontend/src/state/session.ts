import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const authSlice = createSlice({
  name: 'auth',
  initialState: { login: null as string | null },
  reducers: {
    signedIn(state, action: PayloadAction<string>) { state.login = action.payload },
    signedOut(state) { state.login = null },
  },
})
export const { signedIn, signedOut } = authSlice.actions

export type EquipmentSort = 'new' | 'price' | 'power'

const initialFilters = { input: '', minPower: '', page: 1, sort: 'new' as EquipmentSort }
export const filtersSlice = createSlice({
  name: 'equipmentFilters',
  initialState: initialFilters,
  reducers: {
    editPower(state, action: PayloadAction<string>) { state.input = action.payload },
    applyPower(state) { state.minPower = state.input; state.page = 1 },
    setPage(state, action: PayloadAction<number>) { state.page = action.payload },
    setSort(state, action: PayloadAction<EquipmentSort>) { state.sort = action.payload; state.page = 1 },
  },
  extraReducers: builder => builder.addCase(signedOut, () => initialFilters),
})
export const { editPower, applyPower, setPage, setSort } = filtersSlice.actions
