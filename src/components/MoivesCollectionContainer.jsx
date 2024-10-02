import React from 'react'
import { useSelector } from 'react-redux'
import MovieLists from './MovieLists'

const MoivesCollectionContainer = () => {
  const movies = useSelector(store => store.movies)

  return (
    movies.nowPlayingMovies && (
      <div className='bg-black'>
        <div className='-mt-44 pl-12 relative z-20'>
          <MovieLists title={'Now Playing'} movies={movies.nowPlayingMovies} />
          <MovieLists title={'Trending'} movies={movies.nowPlayingMovies} />
          <MovieLists title={'Popular'} movies={movies.nowPlayingMovies} />
          <MovieLists
            title={'Upcoming movies'}
            movies={movies.nowPlayingMovies}
          />
          <MovieLists
            title={'Horror movies'}
            movies={movies.nowPlayingMovies}
          />
        </div>
      </div>
    )
  )
}

export default MoivesCollectionContainer
