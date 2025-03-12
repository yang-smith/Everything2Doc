"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import useAuth from "@/hooks/use-auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("密码最少需要6位");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      // 注册成功后，useAuth 内部会跳转到登录页
    } catch (err: any) {
      setError(err.message || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md mt-10">
      <AuthCard title="注册">
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
          <div className="flex flex-col space-y-1">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span>已有账号? </span>
          <Link href="/login" className="text-blue-500 hover:underline">
            登录
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}