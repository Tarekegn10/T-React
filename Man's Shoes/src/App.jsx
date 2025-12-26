import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import './index.css'
import data from './data'
import DataDisplay from './data-display'

function App() {


  const newData = data.map((item) =>{
    return(
      < DataDisplay
      key={item.id}
      item={item}
      />
    )
  })
  return(
    <div className='container'>
      {newData}
    </div>

  )
}

export default App
