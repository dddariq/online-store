import { createSlice } from '@reduxjs/toolkit'

const initialState = { 
    items: [],
    total: 0
}

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addItem: (state, action) => { 
            const existingItem = state.items.find(item => item.id === action.payload.id)
            if (existingItem) {
                existingItem.quantity += 1
            } else {
                state.items.push({...action.payload, quantity: 1})
            }
            state.total = calculateTotal(state.items)
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload)
            state.total = calculateTotal(state.items)
        },
        updateQuantity: (state, action) => {
            const item = state.items.find(item => item.id === action.payload.id)
            if (item) {
                item.quantity = action.payload.quantity
                state.total = calculateTotal(state.items)
            }
        },
        clearCart: (state) => {
            state.items = []
            state.total = 0
        },
        setCart: (state, action) => {
            state.items = action.payload.items || []
            state.total = action.payload.total || 0
        }
    }
})

const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

export const { addItem, removeItem, updateQuantity, clearCart, setCart } = cartSlice.actions
export default cartSlice.reducer
