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
              {/* Shell contiene la TopBar/TabBar y el AssistantWidget global */}
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

        {/* 404 */}
        <Route path="*" element={<div className="page">404 - No encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
