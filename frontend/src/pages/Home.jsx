import React, { useEffect, useState } from 'react'
import {FiCloudLightning} from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])
  return (
    <div className='mx-2 flex justify-center flex-col gap-0 leading-none'>
      <div
        className={`absolute inset-0 flex items-center justify-center bg-white z-50 transition-all duration-1000 ease-in-out ${loaded ? 'opacity-0 -translate-y-full' : 'opacity-100'
          }`}
      >
        <div className='text-[11rem] text-orange-500 sgxo font-bold uppercase tracking-[0em] flex justify-center items-center'>
            <h1 className="">
            Skill 
            </h1>
            <h1>Sphere</h1>
        </div>
      </div>
      <div className={`transition-all duration-1000 delay-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        <div className='flex m-0 antic-didone justify-evenly gap-2 text-[9rem] '>
          <p className={`tracking-tighter transition-all duration-700 delay-700 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>Your</p>
          <p className={`tracking-tighter text-orange-600 transition-all duration-700 delay-800 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>Collaborative</p>
          <p className={`tracking-tighter  transition-all duration-700 delay-800 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>Skill</p>
          <p className={`tracking-tighter  transition-all duration-700 delay-800 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>Hub</p>
        </div>
        <div className={`my-2 py-2 relative h-screen transition-all duration-1000 delay-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <img
            src="/orangebg.jpg"
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover rounded-4xl z-0"
          />

          <div className=" absolute left-0 top-0  bg-gray-900/30 rounded-4xl h-full w-full " />

          <img
            src="/symbol.svg"
            alt="Background"
            className="animate-spin absolute delay-500 inset-0 w-15 top-5 left-5 h-15 object-cover rounded-4xl z-20"
          />

          <div className="absolute bottom-5 left-5 right-5 leading-none flex flex-col text-white z-10">
            <div className={`flex flex-row justify-between items-center px-6 py-4 transition-all duration-1000 delay-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="flex flex-col p-2  rounded-4xl text-white">
                <div className='flex flex-row items-center gap-3'>
                  <p className="text-3xl ">Connect</p>
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <p className="text-3xl ">Learn</p>
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <p className="text-3xl ">Grow</p>                
                </div>
                <p className="text-2xl">Transform your skills through collaboration.</p>
              </div>
              <div className="flex flex-row gap-2 text-white z-50 text-xl">
                <Link
                  to="/auth/login"
                  className="px-10 py-5 sgxo uppercase text-orange-500 bg-black rounded-4xl hover:bg-gray-800 transition-all duration-200"
                >
                  Hop In <FiCloudLightning className="inline-block ml-1" />
                </Link>
                <Link
                  to="/auth/signup"
                  className="px-10 py-5 sgxo uppercase text-black bg-orange-500 rounded-4xl hover:bg-orange-600 transition-all duration-200"
                >
                  Sign Up <FiCloudLightning className="inline-block ml-1" />
                </Link>
              </div>
            </div>

            <div className={`text-[10rem] text-orange-500 sgxo font-bold uppercase tracking-[0em] flex justify-center items-center transition-all duration-1000 delay-1200 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
            <h1 className="">
            Skill 
            </h1>
            <h1>Sphere</h1>
        </div>

          </div>
        </div>
      </div>
    </div>
  )
}