import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import ClientsPage from "./pages/Clients";
import PropertiesPage from "./pages/Properties";
import ReportsPage from "./pages/Reports";
import CalendarPage from "./pages/Calendar";
import TabBar from "./components/TabBar";
import "./styles/mobile.css";     // << importa los estilos

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="*" element={<div className="page">404 - No encontrada</div>} />
      </Routes>
      <TabBar />
    </BrowserRouter>
  );
};

export default App;
