import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { auth_api } from "@/lib/auth"; 

export default function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查是否已经有 token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // 这里可以添加验证 token 的逻辑
      // 简单起见，我们假设有 token 就是已登录
      setUser({ access_token: token });
    }
    setLoading(false);
  }, []);

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
        
        // 检查是否有保存的重定向路径
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        console.log("登录后重定向到:", redirectPath);
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
        } else {
          router.push("/workspace"); // 默认重定向到工作区
        }
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

  return { user, login, register, logout, loading };
} 