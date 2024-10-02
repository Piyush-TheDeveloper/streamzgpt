import { useDispatch } from 'react-redux'
import { API_OPTIONS, TMDB_URL } from '../utils/constants'
import { addMoviesByCategory } from '../store/moviesSlice'
import { useEffect } from 'react'

const useCategoryMovies = category => {
  const dispatch = useDispatch()
  const getCategoryMoview = async () => {
    const data = await fetch(TMDB_URL(category), API_OPTIONS)
    const json = await data.json()
    console.log(`${category} Movies APICall=`, json.results)
    dispatch(addMoviesByCategory({ category, movies: json.results }))
  }

  useEffect(() => getCategoryMoview, [category])
}

export default useCategoryMovies
