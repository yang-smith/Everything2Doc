import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth_api } from "@/lib/auth"; // 这里假设 api 已经封装好 fetch 请求

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // 登录方法：调用 /login 接口，传入邮箱（作为 username）和密码
  async function login(email: string, password: string) {
    try {
      // 注意：后端登录接口使用 OAuth2PasswordRequestForm，
      // 所以字段名称应为 username 和 password
      const response = await auth_api.login({
        email: email,
        password: password,
      });
      if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        setUser(response);
        router.push("/workspace"); // 登录成功后跳转到工作区
      } else {
        throw new Error("登录失败，未获取到访问令牌");
      }
    } catch (error: any) {
      throw error;
    }
  }

  // 注册方法：调用 /users 接口，传入邮箱和密码
  async function register(email: string, password: string) {
    try {
      console.log(email);
      console.log(password);
      await auth_api.register({ email: email, password: password});
      router.push("/login");
    } catch (error: any) {
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }

  return { user, login, register, logout };
} 