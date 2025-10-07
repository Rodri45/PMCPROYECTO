// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ClientsPage from "./pages/Clients";
import PropertiesPage from "./pages/Properties";
import ReportsPage from "./pages/Reports";
import CalendarPage from "./pages/Calendar";
import Shell from "./layouts/Shell";
import LoginPage from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import TabBar from "./components/TabBar";
import "./styles/mobile.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Privadas */}
        <Route
          element={
            <ProtectedRoute>
              <Shell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Route>

        <Route path="*" element={<div className="page">404 - No encontrada</div>} />
      </Routes>
      {/* La TabBar solo se ve cuando hay sesión, si prefieres ocúltala en /login dentro de TabBar */}
      <TabBar />
    </BrowserRouter>
  );
};

export default App;
