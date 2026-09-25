import { BrowserRouter, Routes, Route, } from "react-router-dom";

import DeviationPage from "./pages/DeviationPage";
import DeviationDashboard from "./pages/DeviationDashboard";
import DeviationDetail from "./pages/DeviationDetail";
import DeviationEditPage from "./pages/DeviationEditPage";
import NotFoundPage from "./pages/NotFoundPage";
import Navbar from "./components/navigation/Navbar";

function App() {
  return (
    <BrowserRouter>
     <Navbar />
     <Routes>
      <Route 
        path="/" element={<DeviationDashboard />}
      />
      <Route 
        path="/deviations/new" element={<DeviationPage />}
      />
      <Route path="/deviations/:id/edit" element={<DeviationEditPage />} />
      <Route path="/deviations/:id" element={<DeviationDetail />} />
      <Route path="*" element={<NotFoundPage />} />
     </Routes>
    </BrowserRouter>
  )
}

export default App;
