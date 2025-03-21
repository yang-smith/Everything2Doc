"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import useAuth from "@/hooks/use-auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // 登录成功后 useAuth 内部会跳转，这里无需额外处理
    } catch (err: any) {
      setError(err.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md mt-10">
      <AuthCard title="登录">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 text-center text-sm text-red-600 bg-red-100 rounded">
              {error}
            </div>
          )}
          <div className="flex flex-col space-y-1">
            <label htmlFor="email">邮箱</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span>还没有账号? </span>
          <Link href="/register" className="text-blue-500 hover:underline">
            注册账号
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}