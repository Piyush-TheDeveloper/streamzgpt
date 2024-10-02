import { createSlice } from '@reduxjs/toolkit'

const categoryToStateKey = {
  now_playing: 'nowPlayingMovies',
  top_rated: 'topRatedMovies',
  popular: 'popularMovies',
  upcoming: 'upcomingMovies',
}

const moviesSlice = createSlice({
  name: 'movies',
  initialState: {
    nowPlayingMovies: null,
    popularMovies: null,
    topRatedMovies: null,
    upcomingMovies: null,
    // horrorMovies: null,
    trailerVideo: null,
  },
  reducers: {
    addMoviesByCategory: (state, action) => {
      const { category, movies } = action.payload
      const stateKey = categoryToStateKey[category]
      if (stateKey) {
        state[stateKey] = movies
      }
    },
    addTrailerVideo: (state, action) => {
      state.trailerVideo = action.payload
    },
  },
})

export const { addMoviesByCategory, addTrailerVideo } = moviesSlice.actions
export default moviesSlice.reducer
