import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

interface AuthCardProps {
  title: string
  children: ReactNode
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}