import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || 'Invalid credentials' };
    }
  };

  const signup = async (name, email, password, role, department = null) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup`, { name, email, password, role, department });
      if (res.data.success) {
        return { success: true, otpRequired: res.data.otpRequired, email: res.data.email };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { email, otp });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Verification failed' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || 'Verification failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
