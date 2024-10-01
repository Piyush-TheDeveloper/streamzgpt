import React from 'react'

const VideoTitle = ({ title, description }) => {
  return (
    <div className='w-screen aspect-video pt-[22%] px-24 absolute text-white bg-gradient-to-r from-black'>
      <h1 className='text-6xl font-bold'>{title}</h1>
      <p className='text-lg py-6 w-1/4'>{description}</p>
      <div className=''>
        <button className='mx-2 bg-white text-black p-4 px-12 text-xl rounded-md hover:bg-opacity-80'>
          ▶️ Play
        </button>
        <button className='bg-gray-500 text-white p-4 px-12 text-xl rounded-md hover:bg-opacity-80'>
          More Info
        </button>
      </div>
    </div>
  )
}

export default VideoTitle
