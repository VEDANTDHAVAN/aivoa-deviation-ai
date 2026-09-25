import { BrowserRouter, Routes, Route, } from "react-router-dom";

import DeviationPage from "./pages/DeviationPage";
import DeviationDashboard from "./pages/DeviationDashboard";
import DeviationDetail from "./pages/DeviationDetail";

function App() {
  return (
    <BrowserRouter>
     <Routes>
      <Route 
        path="/" element={<DeviationDashboard />}
      />
      <Route 
        path="/deviations/new" element={<DeviationPage />}
      />
      <Route path="/deviations/:id" element={<DeviationDetail />} />
     </Routes>
    </BrowserRouter>
  )
}

export default App;
