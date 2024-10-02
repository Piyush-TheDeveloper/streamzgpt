import React from 'react'
import { useSelector } from 'react-redux'
import VideoTitle from './VideoTitle'
import VideoTrailer from './VideoTrailer'

const HeroContainer = () => {
  const movies = useSelector(store => store.movies?.nowPlayingMovies)

  if (movies === null) return
  const heroMovie = movies[2]
  const { original_title, overview, id } = heroMovie

  return (
    <div>
      <VideoTitle title={original_title} description={overview} />
      <VideoTrailer movieId={id} />
    </div>
  )
}

export default HeroContainer
