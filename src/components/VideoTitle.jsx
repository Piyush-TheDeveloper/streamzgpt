import React from 'react'

const VideoTitle = ({ title, description }) => {
  return (
    <div className='pt-36 px-12'>
      <h1 className='text-6xl font-bold'>{title}</h1>
      <p className='text-lg py-6 w-1/4'>{description}</p>
      <div className=''>
        <button className='mx-2 bg-gray-500 text-white p-4 px-12 text-xl rounded-md bg-opacity-50'>
          ▶️ Play
        </button>
        <button className='bg-gray-500 text-white p-4 px-12 text-xl rounded-md bg-opacity-50'>
          More Info
        </button>
      </div>
    </div>
  )
}

export default VideoTitle
