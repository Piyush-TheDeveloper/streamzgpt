import React from 'react'
import { useSelector } from 'react-redux'
import MovieLists from './MovieLists'

const MoivesCollectionContainer = () => {
  const movies = useSelector(store => store.movies)

  return (
    movies.nowPlayingMovies && (
      <div className='bg-black w-screen aspect-auto'>
        <div className='-mt-44 pl-12 relative z-20'>
          {movies.nowPlayingMovies && (
            <MovieLists
              title={'Now Playing'}
              movies={movies.nowPlayingMovies}
            />
          )}
          {movies.topRatedMovies && (
            <MovieLists title={'Trending'} movies={movies.topRatedMovies} />
          )}
          {movies.popularMovies && (
            <MovieLists title={'Popular'} movies={movies.popularMovies} />
          )}
          {movies.upcomingMovies && (
            <MovieLists
              title={'Upcoming Movies'}
              movies={movies.upcomingMovies}
            />
          )}
          {/* {movies.horrorMovies && (
            <MovieLists title={'Horror Movies'} movies={movies.horrorMovies} />
          )} */}
        </div>
      </div>
    )
  )
}

export default MoivesCollectionContainer
