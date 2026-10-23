import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getProfile, saveProfile, type UserProfile } from '../../services/database';

type ProfileState = {
  profile: UserProfile | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  saving: boolean;
  error: string | null;
};

const initialState: ProfileState = {
  profile: null,
  status: 'idle',
  saving: false,
  error: null,
};

export const loadProfile = createAsyncThunk('profile/load', () => getProfile());

export const updateProfile = createAsyncThunk(
  'profile/save',
  async (details: { name: string; location: string }) => {
    const profile: UserProfile = {
      id: 'current',
      name: details.name.trim(),
      location: details.location.trim(),
    };

    await saveProfile(profile);
    return profile;
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload ?? null;
      })
      .addCase(loadProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Unable to load your profile.';
      })
      .addCase(updateProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Unable to save your profile.';
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
