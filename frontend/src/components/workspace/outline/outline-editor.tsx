import { Button } from "@/components/ui/button"

interface OutlineSection {
    title: string;
    content?: string;
  }
  
export interface OutlineData {
    title: string;
    sections: OutlineSection[];
}

  interface OutlineEditorProps {
    outline: OutlineData;
    onChange: (outline: OutlineData) => void;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
  }
  
  export function OutlineEditor({
    outline,
    onChange,
    onConfirm,
    onCancel,
    isLoading
  }: OutlineEditorProps) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">文档大纲</h2>
          
          {/* 标题编辑 */}
          <div className="mb-4">
            <label className="text-sm font-medium">文档标题</label>
            <input
              type="text"
              value={outline.title}
              onChange={(e) => 
                onChange({ ...outline, title: e.target.value })
              }
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
  
          {/* 章节列表 */}
          <div className="space-y-4">
            {outline.sections.map((section, index) => (
              <div key={index} className="p-4 border rounded-md">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => {
                    const newSections = [...outline.sections];
                    newSections[index].title = e.target.value;
                    onChange({ ...outline, sections: newSections });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            ))}
          </div>
  
          {/* 操作按钮 */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={onConfirm} disabled={isLoading}>
              {isLoading ? "处理中..." : "确认大纲"}
            </Button>
          </div>
        </div>
      </div>
    )
  }