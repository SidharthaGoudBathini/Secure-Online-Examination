import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid academic email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(data.email, data.password);
    setIsLoading(false);

    if (res.success) {
      addToast('Welcome back! You have logged in securely.', 'success');
      // Redirect according to user role or origin
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user?.role === 'STUDENT') navigate('/student/dashboard');
      else if (user?.role === 'FACULTY') navigate('/faculty/dashboard');
      else if (user?.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } else {
      setErrorMessage(res.message || 'Invalid credentials. Please try again.');
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-2xl bg-navy-900 flex items-center justify-center text-white shadow-md group-hover:bg-royal-600 transition">
            <Shield className="w-7 h-7 text-royal-300" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-black text-navy-900 tracking-tight">
          Sign In to SecureExam
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your academic credentials to access your portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-xl">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="student@secureexam.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 transition"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 transition"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-navy-900 hover:bg-royal-600 text-white rounded-xl font-semibold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick fill buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center">
              <Sparkles className="w-3 h-3 text-royal-500 mr-1" />
              Quick Fill Demo Credentials:
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillCredentials('student@secureexam.edu', 'Student@123')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-medium border border-emerald-200 transition text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('faculty@secureexam.edu', 'Faculty@123')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-medium border border-blue-200 transition text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('admin@secureexam.edu', 'Admin@123')}
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-medium border border-purple-200 transition text-center"
              >
                Admin
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Need an academic account?{' '}
            <Link to="/register" className="font-semibold text-royal-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
