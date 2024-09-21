import { useDispatch } from 'react-redux'
import { API_OPTIONS, TMDB_MOVIE_VIDEO_URL } from '../utils/constants'
import { addTrailerVideo } from '../store/moviesSlice'
import { useEffect } from 'react'

const useMovieTrailer = movieId => {
  const dispatch = useDispatch()
  const getMovieTrailer = async () => {
    const data = await fetch(TMDB_MOVIE_VIDEO_URL(movieId), API_OPTIONS)
    const response = await data.json()
    const filterData = response?.results.filter(
      video => video.type === 'Trailer',
    )
    const trailer = filterData.length ? filterData[0] : response?.results[0]
    dispatch(addTrailerVideo(trailer))
  }

  useEffect(() => {
    getMovieTrailer()
  }, [])
}

export default useMovieTrailer
