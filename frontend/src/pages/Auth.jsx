import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    phoneno: "",
    age: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/users/login" : "/users/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { ...formData, age: Number(formData.age) };

      await api.post(endpoint, payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition";

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 text-white">
          <div className="text-2xl mb-1">🎟️</div>
          <h1 className="text-xl font-bold">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {isLogin ? "Sign in to access your tickets" : "Join EventTix today"}
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input type="text" name="fullname" placeholder="John Doe" value={formData.fullname} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                  <input type="tel" name="phoneno" placeholder="+91 98765 43210" value={formData.phoneno} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                  <input type="number" name="age" placeholder="25" min="1" value={formData.age} onChange={handleChange} required className={inputClass} />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
              <input type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-semibold hover:underline">
              {isLogin ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}