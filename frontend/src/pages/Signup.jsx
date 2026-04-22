import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';
import './Login.css'; // We can reuse the login styles

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await signup(name, email, password);
      // On success, redirect to login page
      navigate('/');
    } catch (error) {
      if (error.response && error.response.data) {
        const { message, error: errorType } = error.response.data;
        if (typeof message === 'object') {
          const firstError = Object.values(message)[0];
          setErrorMsg(firstError);
        } else {
          setErrorMsg(message || errorType || 'Registration failed');
        }
      } else {
        setErrorMsg('Unable to connect to the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card shadow-box">
        <h2>Sign Up</h2>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email address:</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary w-100 mt-3" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
