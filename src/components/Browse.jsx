import React from 'react'
import Header from './Header'
import HeroContainer from './HeroContainer'
import MoivesCollectionContainer from './MoivesCollectionContainer'
import useCategoryMovies from '../hooks/useCategoryMovies'

const Browse = () => {
  //Custome Hook for fetching Now Playing Movies from TMDB API
  useCategoryMovies('now_playing')
  useCategoryMovies('popular')
  useCategoryMovies('top_rated')
  useCategoryMovies('upcoming')
  // const arr = [
  //   { id: 1, name: 'John Doe', email: 'john@example.com' },
  //   { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  //   { id: 33, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 32, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 53, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 83, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 43, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 63, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 32, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 39, name: 'Alice Johnson', email: 'alice@example.com' },
  //   { id: 13, name: 'Alice Johnson', email: 'alice@example.com' },
  // ]
  // function getRandomItem(arr) {
  //   const randomIndex = Math.floor(Math.random() * arr.length)
  //   return arr[randomIndex]
  // }

  return (
    <div>
      <Header />
      <HeroContainer />
      <MoivesCollectionContainer />
    </div>
  )
}

export default Browse
