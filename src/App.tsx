import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { About } from './pages/About'
import { Album } from './pages/Album'
import { Home } from './pages/Home'

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/albums/:slug" element={<Album />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}

export default App
