"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.message || "注册失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="不二集 Never2"
            width={120}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            不二集
          </h1>
          <p className="text-gray-500">凡所记录，皆不再犯。</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">注册</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">邮箱</label>
              <input
                type="email"
                className="input-field"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">昵称（可选）</label>
              <input
                type="text"
                className="input-field"
                placeholder="给自己起个名字吧"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                className="input-field"
                placeholder="至少6位密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">确认密码</label>
              <input
                type="password"
                className="input-field"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5"
              disabled={loading}
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            已有账号？
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium ml-1"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
