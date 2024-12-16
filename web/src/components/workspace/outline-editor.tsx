import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from '@/lib/api'
import { toast } from '@/hooks/use-toast'

interface OutlineSectionProps {
  projectId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface OutlineData {
  outline: string;
  suggestions: string;
}

export function OutlineEditor({ projectId, onComplete, onBack }: OutlineSectionProps) {
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 解析AI返回的字符串
  const parseOutlineResponse = (response: string): OutlineData => {
    const outlineMatch = response.match(/<outline>([\s\S]*?)<\/outline>/);
    const suggestionsMatch = response.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
    
    return {
      outline: outlineMatch ? outlineMatch[1].trim() : '',
      suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : ''
    };
  };

  // 生成大纲
  const handleGenerateOutline = async () => {
    try {
      setLoading(true);
      const response = await api.generateOutline(projectId);
      const { outline, suggestions } = parseOutlineResponse(response);
      setOutline(outline);
      setSuggestions(suggestions);
    } catch (error) {
      toast({
        title: "生成大纲失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 更新大纲
  const handleUpdateOutline = async () => {
    try {
      setLoading(true);
      // 组合大纲和建议
      const content = `<outline>\n${outline}\n</outline>\n\n<suggestions>\n${suggestions}\n</suggestions>`;
      await api.updateOutline(projectId, content);
      setIsEditing(false);
      toast({
        title: "更新成功",
        description: "大纲已保存",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">文档大纲</h2>
      <div className="space-x-2">
        {!outline && (
          <Button 
            onClick={handleGenerateOutline} 
            disabled={loading}
          >
            生成大纲
          </Button>
        )}
        {outline && !isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
          >
            编辑
          </Button>
        )}
        {isEditing && (
          <>
            <Button 
              onClick={() => setIsEditing(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateOutline}
              disabled={loading}
            >
              保存
            </Button>
          </>
        )}
      </div>
    </div>

    {outline && (
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium">章节结构</label>
          <Textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            disabled={!isEditing}
            className="mt-1 font-mono h-[500px]"  
          />
        </div>

        <div>
          <label className="text-sm font-medium">写作建议</label>
          <Textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            disabled={!isEditing}
            className="mt-1 h-[500px]"  
          />
        </div>
      </div>
    )}
    {/* 底部导航按钮 */}
    <div className="flex justify-between pt-4 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        className="w-[100px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="m15 18-6-6 6-6"/>
        </svg>
        上一步
      </Button>

      <Button
        onClick={onComplete}
        className="w-[100px]"
        disabled={!outline || isEditing} // 如果正在编辑或没有大纲时禁用
      >
        下一步
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-2"
        >
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </Button>
    </div>
  </div>
);

}