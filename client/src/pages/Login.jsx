import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LOGO from '../assets/logo.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // CAPTCHA State & Refs
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef(null);

  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw noise lines
    ctx.strokeStyle = '#94a3b8';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.stroke();
    }
    
    // Draw noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw characters with random rotation, color, and size
    ctx.textBaseline = 'middle';
    const charSpacing = canvas.width / (code.length + 1);
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const fontSize = 24 + Math.random() * 6;
      ctx.font = `bold ${fontSize}px sans-serif`;
      
      // Random high contrast colors
      const colors = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#4f46e5', '#0891b2', '#7c3aed'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      const x = (i + 1) * charSpacing + (Math.random() * 8 - 4);
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      
      // Rotate
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(char, -10, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (captchaCode) {
      drawCaptcha(captchaCode);
    }
  }, [captchaCode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (captchaInput.toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Invalid CAPTCHA code. Please try again.');
      generateCaptcha();
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(formData.email, formData.password);
    setLoading(false);
    if (res.success) {
      // Redirect based on role
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser.role === 'PROPOSER') {
        navigate('/proposer-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img src={LOGO} alt="Student Intern Portal" className="mx-auto h-20 w-auto mb-4 object-contain" />
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Student Intern Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Role-Based Trainee Entry & Approval System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 py-8 px-4 shadow-xl rounded-3xl sm:px-10">
          <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">Sign In</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Security Verification <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <canvas
                  ref={canvasRef}
                  width="180"
                  height="46"
                  className="border border-slate-350 rounded-xl overflow-hidden shadow-inner bg-slate-100"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="px-3 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-650 text-md rounded-xl transition duration-150 active:scale-95 cursor-pointer font-bold"
                  title="Refresh CAPTCHA"
                >
                  ↻
                </button>
              </div>
              <input
                type="text"
                name="captcha"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setError('');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                placeholder="Enter the 6-character code"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-orange-500/25 hover:shadow-orange-600/35 transition duration-250 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-orange-600 hover:text-orange-500 font-semibold transition">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;