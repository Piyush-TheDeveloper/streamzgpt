import React from 'react'
import Header from './Header'
import useNowPlayingMovies from '../hooks/useNowPlayingMovies'

const Browse = () => {
  //Custome Hook for fetching Now Playing Movies from TMDB API
  useNowPlayingMovies()

  return (
    <div>
      <Header />
    </div>
  )
}

export default Browse
