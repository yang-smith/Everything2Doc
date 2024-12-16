import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Save, X } from 'lucide-react'

interface DocPreviewProps {
  title: string
  content: string
  onEdit?: (title: string, content: string) => void
}

export function DocPreview({ title, content, onEdit }: DocPreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)
  const [editedContent, setEditedContent] = useState(content)

  const handleSave = () => {
    onEdit?.(editedTitle, editedContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTitle(title)
    setEditedContent(content)
    setIsEditing(false)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-b border-gray-200 focus:border-primary outline-none"
          />
        ) : (
          <h2 className="text-xl font-bold">{title}</h2>
        )}

        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              编辑
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full min-h-[300px] p-4 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <div className="prose max-w-none">
          {content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
    </Card>
  )
} 