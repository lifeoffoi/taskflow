import { createSlice, createAsyncThunk} from '@reduxjs/toolkit'
import axios from 'axios'

export const registerUser = createAsyncThunk(
    'auth/register',
    async ( {name, email, password, role}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`http://localhost:3001/users?email=${email}`);
            if (response.data.length > 0) return rejectWithValue('Email already exists');
            const newUser = { name, email, password, role: role || 'user' };
            const res = await axios.post('http://localhost:3001/users', newUser);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }

    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async ( {email, password}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`http://localhost:3001/users?email=${email}&password=${password}`);
            if (response.data.length == 0) return rejectWithValue('Invalid email or password');
            const user = response.data[0];
            return user;
        } catch (error) {
            return rejectWithValue(error.message);
        } 
    }
);


const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        status: 'idle',
        error: null,
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            localStorage.removeItem('user');
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(loginUser.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        });     
        builder.addCase(loginUser.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
        builder.addCase(registerUser.pending, (state) => {
            state.status = 'loading';
            state.error = null;
        });
        builder.addCase(registerUser.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.user = action.payload;
            localStorage.setItem('user', JSON.stringify(action.payload));
        });
        builder.addCase(registerUser.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

