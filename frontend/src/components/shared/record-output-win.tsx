import React from "react";
import Image from "next/image";
import { ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const RecordOutputWin: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b">
        <div className="max-w-3xl">
          <p className="text-gray-600 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
            <AlertCircle className="inline-block mr-2 h-5 w-5 text-yellow-600" />
            <span>该工具某头部IP背书，且自己<strong>已进行断网测试过</strong>。工具不用联网，也可以本地运行，没有发现数据被上传到云端。</span>
          </p>
        </div>
      </div>

      {/* Steps section */}
      <div className="p-8">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-lg">
                1
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">进入下载链接</h3>
                <a 
                  href="https://memotrace.cn/" 
                  className="text-blue-600 font-medium hover:underline inline-flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://memotrace.cn/
                  <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-lg">
                2
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-3">点击下载</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/images/image1.png" 
                      alt="MemoTrace下载页面" 
                      width={600} 
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Image 
                      src="/images/image2.png" 
                      alt="MemoTrace下载界面" 
                      width={600} 
                      height={400}
                      className="w-full h-auto" 
                    />
                  </div>
                </div>
                
                <div className="mt-6 bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <h4 className="font-semibold text-amber-800 flex items-center mb-2">
                    <AlertCircle className="mr-2 h-5 w-5" /> 
                    注意：如果发现下面这种情况
                  </h4>
                  <p className="text-amber-700 mb-3">点击验证还是下载不了，网页旁边有一个"手机下载请扫描二维码"的方式。可以先在手机下载好，再发到电脑上安装。</p>
                  <div className="border border-amber-200 rounded-xl overflow-hidden shadow-sm mx-auto max-w-sm">
                    <Image 
                      src="/images/image3.png" 
                      alt="下载验证问题" 
                      width={400} 
                      height={300}
                      className="h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-lg">
                3
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-3">下载完成后，根据提示正常安装</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image4.png" 
                    alt="安装提示" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-gray-700 mb-2">安装完成，就会弹出这个界面窗口。不要觉得丑，就打退堂鼓了！</p>
                <p className="text-gray-700 mb-4">咱们继续按照下面操作几步，会发现它超级好用。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image5.png" 
                    alt="MemoTrace主界面" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                  <p className="text-gray-800">
                    窗口界面里的其他按钮都不用管，<strong>保持微信电脑端打开</strong>的情况下，点击"获取信息"。马上你就可以看到，你微信的手机号、昵称、微信ID都被提取了出来。
                  </p>
                </div>
                
                <p className="text-gray-700 mb-4">接着点击"解析数据"按钮，就开始加载你的聊天记录了。只要电脑设备没问题，很快就完成了。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image6.png" 
                    alt="解析数据界面" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                  <p className="text-gray-800 mb-2">
                    然后你会发现，熟悉的微信界面出现了。我们只需要选中你想要导出聊天记录的聊天窗口，<strong>点击右上角"导出聊天记录"，"导出TXT"格式。</strong>
                  </p>
                  <p className="text-gray-700">
                    这个格式其实是把聊天记录一些无关紧要的信息给筛掉了，然后做了信息格式的调整。这样的数据才方便被AI识别分析处理。
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image7.png" 
                    alt="导出TXT界面" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-gray-700 mb-4">点击导出TXT后，选择信息类型。一般只勾选聊天记录里面的文本、分享卡片（公号文章链接）、文件。其他内容基本上都是噪音，可以不要。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image8.png" 
                    alt="选择信息类型" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                  <h4 className="font-semibold text-amber-800 flex items-center mb-2">
                    <AlertCircle className="mr-2 h-5 w-5" /> 
                    提示
                  </h4>
                  <p className="text-amber-700">另外，建议选择一个时间范围，否则聊天记录一次性全部导出，你的电脑会卡机！</p>
                </div>
                
                <p className="text-gray-700 mb-4">我选择了最近三个月，然后点击开始。几秒后就会给你一个窗口，显示导出成功。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image9.png" 
                    alt="导出成功" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-gray-700 mb-4">点击"打开"，找到对应的TXT文件。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image10.png" 
                    alt="文件位置" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <p className="text-gray-700 mb-4">打开文件，大概长这样。</p>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
                  <Image 
                    src="/images/image11.png" 
                    alt="TXT文件内容" 
                    width={600} 
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center mb-2">
                    <CheckCircle2 className="mr-2 h-5 w-5" /> 
                    完成！
                  </h4>
                  <p className="text-green-700 mb-2">到这里，就结束了。</p>
                  <p className="text-green-700">接下来，你可以用这部分数据内容，利用工具分析和整理。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordOutputWin;
