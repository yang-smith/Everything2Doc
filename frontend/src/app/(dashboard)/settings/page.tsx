"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Profile form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccessMessage('个人资料已更新')
    } catch (error) {
      console.error('更新失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-gray-500">管理您的账户设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            安全
          </TabsTrigger>
        </TabsList>

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <TabsContent value="profile">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">个人资料</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : "保存更改"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">修改密码</h2>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="••••••••" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="••••••••" 
                />
              </div>
              
              <Button>更改密码</Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}