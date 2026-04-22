import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import AddExpense from './pages/AddExpense';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/edit-group/:groupId" element={<CreateGroup />} />
          <Route path="/group/:groupId/add-expense" element={<AddExpense />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
