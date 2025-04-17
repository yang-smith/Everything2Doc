import React from "react";
import Image from "next/image";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const RecordOutputMac: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b">
        <div className="max-w-3xl">
          <p className="text-gray-600 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
            <AlertCircle className="inline-block mr-2 h-5 w-5 text-yellow-600" />
            <span>Mac用户可以通过以下步骤直接复制微信聊天记录，无需安装额外软件。</span>
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="p-8">
        <div className="space-y-12">
          {/* Part 1 */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-lg mr-3">
                1
              </div>
              同步聊天记录（电脑端跟手机端的信息不一致）
            </h2>
            
            <div className="ml-14 space-y-5">
              <p className="text-gray-700">建议先把手机端聊天记录跟电脑端进行同步：</p>
              <ol className="list-decimal pl-5 space-y-6">
                <li className="text-gray-700">手机微信发起迁移功能（⚠️非备份功能）</li>
                <li className="text-gray-700">
                  打开微信"我"→"设置"
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image1.png" 
                      alt="微信设置" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                  </div>
                </li>
                <li className="text-gray-700">
                  点击"通用"→"聊天记录"→"聊天记录迁移与备份"
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image2.png" 
                      alt="聊天记录迁移与备份" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                  </div>
                </li>
                <li className="text-gray-700">
                  选中"迁移"→"迁移到电脑"，完成迁移操作
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Image 
                        src="/imgs-mac/image3.png" 
                        alt="迁移选项" 
                        width={300} 
                        height={200}
                        className="h-auto"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Image 
                        src="/imgs-mac/image4.png" 
                        alt="迁移到电脑" 
                        width={300} 
                        height={200}
                        className="h-auto"
                      />
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Part 2 */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-lg mr-3">
                2
              </div>
              导出聊天记录（电脑端跟手机端信息一致）
            </h2>
            
            <div className="ml-14 space-y-5">
              <ol className="list-decimal pl-5 space-y-6">
                <li className="text-gray-700">
                  Mac端打开聊天框，点击聊天框，右上角"…"三个点，选择"查找聊天记录"
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image5.png" 
                      alt="查找聊天记录" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                  </div>
                </li>
                <li className="text-gray-700">
                  打开查找聊天记录，根据日期进行筛选准备要导出的聊天信息
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image6.png" 
                      alt="筛选聊天记录" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                  </div>
                </li>
                <li className="text-gray-700">
                  筛选完后找到了你想要分析的聊天记录，点击鼠标右键，选择"多选"选项。
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image7.png" 
                      alt="多选选项" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                  </div>
                </li>
                <li className="text-gray-700">
                  从要选择的信息先选中"开头"的第一条信息，然后一直往下拉到"底部/最后的一条信息"，按住Shift建，点击最后一条数据，完全所有聊天数据的选定
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Image 
                        src="/imgs-mac/image8.png" 
                        alt="选中开始信息" 
                        width={280} 
                        height={200}
                        className="h-auto"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <Image 
                        src="/imgs-mac/image9.png" 
                        alt="选中结束信息" 
                        width={280} 
                        height={200}
                        className="h-auto"
                      />
                    </div>
                  </div>
                </li>
                <li className="text-gray-700">
                  <strong>Command+C</strong>（苹果电脑）将所有聊天记录进行复制，<strong>Command+V</strong>（苹果电脑）将聊天记录进行粘贴。
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-3 mb-3">
                    <p className="text-amber-700">
                      <AlertCircle className="inline-block mr-2 h-5 w-5 text-amber-600" />
                      找到一个txt文档粘贴进去即可，可以是电脑自带的文本编辑器，Command + S保存文件，并使用"文件名.txt"/"文件名.md"格式
                    </p>
                  </div>
                  
                  <div className="mt-3 mx-auto max-w-sm border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/imgs-mac/image10.png" 
                      alt="粘贴到文本编辑器" 
                      width={300} 
                      height={200}
                      className="h-auto"
                    />
                    <p className="p-3 text-sm text-gray-600">我这里用的文档编辑器是 obsidian</p>
                  </div>
                </li>
                <li className="text-gray-700">导出成功，并找到文档在电脑中的保存位置即可。</li>
              </ol>
              
              <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200">
                <h4 className="font-semibold text-green-800 flex items-center mb-2">
                  <CheckCircle2 className="mr-2 h-5 w-5" /> 
                  优点
                </h4>
                <p className="text-green-700">完全使用了微信群聊原生的迁移功能，上下滑动可以支持多个时间日期的信息</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordOutputMac;
