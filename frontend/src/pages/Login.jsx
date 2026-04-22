import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const data = await login(email, password);
      
      // Save token (e.g. in localStorage)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      
      navigate('/dashboard');
    } catch (error) {
      if (error.response && error.response.data) {
        // Backend returned a specific error from our GlobalExceptionHandler
        const { message, error: errorType } = error.response.data;
        
        if (typeof message === 'object') {
          // Validation error object (e.g. { "email": "must not be blank" })
          const firstError = Object.values(message)[0];
          setErrorMsg(firstError);
        } else {
          // Business error string
          setErrorMsg(message || errorType || 'Invalid email or password');
        }
      } else {
        // Network error
        setErrorMsg('Unable to connect to the server. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card shadow-box">
        <h2>Log in</h2>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary w-100 mt-3" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="forgot-password">
          <a href="#">Forgot your password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
