import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import DetectionView from "./pages/DetectionView.jsx";
import HistoryView from "./pages/HistoryView.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<DetectionView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;