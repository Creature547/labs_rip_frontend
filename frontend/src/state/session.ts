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

const initialFilters = { input: '', minPower: '', sort: 'new' as 'new' | 'price' }
export const filtersSlice = createSlice({
  name: 'equipmentFilters',
  initialState: initialFilters,
  reducers: {
    editPower(state, action: PayloadAction<string>) { state.input = action.payload },
    applyPower(state) { state.minPower = state.input },
    setSort(state, action: PayloadAction<'new' | 'price'>) { state.sort = action.payload },
  },
  extraReducers: builder => builder.addCase(signedOut, () => initialFilters),
})
export const { editPower, applyPower, setSort } = filtersSlice.actions
