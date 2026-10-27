import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ForumHome from './pages/ForumHome';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import PostDetail from './pages/PostDetail';
import Guide from './pages/Guide';
import Tours from './pages/Tours'; // <--- 1. IMPORTAR TOURS
import NewsPage from './pages/NewsPage';

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen merriweather-regular">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/foro" element={<ForumHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/foro/:id" element={<PostDetail />} />
            <Route path="/guia" element={<Guide />} />
            <Route path="/tours" element={<Tours />} /> {/* <--- 2. AGREGAR RUTA */}
            <Route path="/noticias" element={<NewsPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App;