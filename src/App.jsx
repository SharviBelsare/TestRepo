import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import your pages
// import Home from './pages/Home';
// import About from './pages/About';
import Miropage from './pages/Miropage'; // Your Miro embed page
import Figma from './pages/Figma';
import Github from './pages/Github';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/home" />} />

        {/* Pages */}
        {/* <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} /> */}
        <Route path="/miro" element={<Miropage />} />
        <Route path="/figma" element={<Figma />} />
        <Route path="/github" element={<Github/>} />

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
