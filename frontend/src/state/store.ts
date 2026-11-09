import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { authSlice, filtersSlice } from './session'
import { equipmentSlice } from './equipment'

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    equipmentFilters: filtersSlice.reducer,
    heatingEquipment: equipmentSlice.reducer,
  },
})
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>()
export const useAppSelector = useSelector.withTypes<ReturnType<typeof store.getState>>()
