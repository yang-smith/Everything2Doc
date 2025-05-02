'use client'

import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"
import { Navbar } from "@/components/shared/navbar"

export default function LandingPage() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Main section with gradient background */}
      <section className="relative w-full h-[800px] bg-gradient-to-t from-white to-[#ECE5FF]">
        {/* Blur effects */}
        <div className="absolute w-[949.69px] h-[547.3px] right-[107.53px] top-[-428px] bg-[#371AE7] blur-[100px] rounded-[728px]"></div>
        <div className="absolute w-[791px] h-[514px] left-[227px] top-[-313px] bg-[#371AE7] blur-[100px] rounded-[326.25px]"></div>
        <div className="absolute w-[536px] h-[523px] right-[-139.19px] top-[-275.16px] bg-[#F8FF37] blur-[150px] rounded-[529.5px]"></div>
        <div className="absolute w-[536px] h-[523px] right-[1424.39px] top-[-300px] bg-[#F5FF37] blur-[150px] rounded-[529.5px]"></div>
        <div className="absolute w-[372px] h-[373px] right-[1268px] top-[-187px] bg-[#22B5FF] blur-[150px] rounded-[345px]"></div>

        {/* Header */}
        <Navbar />

        {/* Main content */}
        <div className="absolute w-[1072px] h-[422.48px] left-1/2 top-[100px] -translate-x-1/2 flex flex-col justify-center items-center gap-[48px]">
          <div className="w-[1072px] h-[324.48px] relative">
            <div className="absolute w-[1216px] h-[242.09px] left-1/2 -translate-x-1/2 top-0 flex flex-col items-center px-[248px] pb-[12.59px] gap-[15.5px]">
              {/* Beta tag */}
              <div className="flex items-center px-[8px] py-[6px] w-[82px] h-[42px] bg-white/50 rounded-[50px]">
                <div className="flex justify-center items-center px-[12px] py-[4px] w-[66px] h-[30px] bg-[#F0F0F2] rounded-[16px]">
                  <span className="w-[42px] h-[22px] font-[PingFang SC] font-semibold text-[14px] leading-[22px] flex items-center text-center text-[#4D35FF]">
                    测试版
                  </span>
                </div>
              </div>

              {/* Main heading */}
              <h1 className="w-[720px] h-[172px] font-[PingFang SC] font-medium text-[65px] leading-[120%] flex items-center text-center text-[#0D1216]">
                告别群聊焦虑
                <br />
                开启社群知识管理时代
              </h1>
            </div>

            {/* Subheading */}
            <p className="absolute w-[735.78px] h-[64px] left-1/2 -translate-x-1/2 top-[250.49px] font-[PingFang SC] font-normal text-[20px] leading-[32px] flex items-center text-center text-[#494959]">
              基于AI技术，自动分析你的聊天记录，精准提取关键信息并生成结构化视觉化知识文档，让每一条碎片信息都成为你的知识资产。
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-[20px] w-[284px] h-[50px]">
            <Link href="#features">
              <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[123px] h-[50px] border border-[#4D35FF] rounded-[8px]">
              <span className="w-[100px] h-[24px] font-[PingFang SC] font-medium text-[16px] leading-[24px] flex items-center text-[#4D35FF]">
                了解更多
              </span>
            </button>
            </Link>
            <Link href="/workspace">
            <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[144px] h-[50px] bg-[#4D35FF] rounded-[8px]">
              <span className="w-[100px] h-[24px] font-[PingFang SC] font-medium text-[16px] leading-[24px] flex items-center text-white">
                免费试用
              </span>
              <ArrowUpRight className="w-[20px] h-[20px] text-white" />
            </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section 1 */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                超长聊天记录秒级分析，
                <br />
                解决GPT容不下的难题
              </h2>
              <p className="text-lg mb-6 text-[#494959]">
                每天几百条的群聊消息，GPT无法一次性处理？我们的AI能够快速分析超长聊天记录，提取关键信息，生成结构化知识文档。
              </p>
              <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[120px] h-[50px] border border-[#4D35FF] rounded-[8px]">
                <span className="font-medium text-[16px] leading-[24px] text-[#4D35FF]">了解更多</span>
              </button>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg">
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Analytics Dashboard"
                width={500}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 */}
      <section className="w-full py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-gray-100 p-6 rounded-lg">
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Social Group Analysis"
                width={500}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                专注于社群群聊分析，
                <br />
                精准可视化信息易寻
              </h2>
              <p className="text-lg mb-6 text-[#494959]">
                针对社群群聊场景优化的AI分析引擎，能够理解群聊上下文，识别关键讨论主题，并将信息可视化呈现，让重要信息一目了然。
              </p>
              <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[120px] h-[50px] border border-[#4D35FF] rounded-[8px]">
                <span className="font-medium text-[16px] leading-[24px] text-[#4D35FF]">查看案例</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 3 */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                ���约设计，完美适配，
                <br />
                轻松分享社群报告
              </h2>
              <p className="text-lg mb-6 text-[#494959]">
                生成的知识文档设计简约美观，适配多种设备，一键分享给团队成员，让群聊中的知识资产得到最大化利用。
              </p>
              <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[120px] h-[50px] border border-[#4D35FF] rounded-[8px]">
                <span className="font-medium text-[16px] leading-[24px] text-[#4D35FF]">查看演示</span>
              </button>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg">
              <Image
                src="/placeholder.svg?height=400&width=500"
                alt="Report Generation"
                width={500}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Simple Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">只需三个步骤即可轻松搞定</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-[#4D35FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4D35FF] font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">导入聊天记录</h3>
              <p className="text-gray-600">支持微信、钉钉等主流社交工具的聊天记录导入</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-[#4D35FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4D35FF] font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">选择分析上传聊天记录</h3>
              <p className="text-gray-600">AI自动分析聊天内容，提取关键信息</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-12 h-12 bg-[#4D35FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#4D35FF] font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">全流程可视化呈现一键导出</h3>
              <p className="text-gray-600">生成结构化知识文档，一键分享给团队成员</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">强大的智能功能，</h2>
          <p className="text-lg text-center mb-12 max-w-2xl mx-auto">满足您社群管理和知识流通的需求</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8V16M8 12H16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">智能分析</h3>
              <p className="text-gray-600">自动分析聊天记录，提取关键信息，生成结构化知识文档</p>
            </div>

            <div className="p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-purple-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 20H7C5.89543 20 5 19.1046 5 18V9L12 4L19 9V18C19 19.1046 18.1046 20 17 20Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">知识库管理</h3>
              <p className="text-gray-600">将群聊中的碎片信息整合为结构化知识库，方便查询和使用</p>
            </div>

            <div className="p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">群聊日历</h3>
              <p className="text-gray-600">自动识别群聊中的日程安排，生成日历提醒，不错过重要事项</p>
            </div>

            <div className="p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">精准任务</h3>
              <p className="text-gray-600">自动识别群聊中的任务分配，跟踪任务进度，提高团队协作效率</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="flex flex-col items-center py-20 px-4 md:px-10 lg:px-20 bg-white">
        <div className="flex flex-col justify-center items-center gap-4 max-w-[1180px]">
          {/* FAQ Badge */}
          <div className="flex justify-center items-center py-2 px-4 bg-[#F1F6FF] rounded-[16px]">
            <span className="font-[PingFang SC] font-semibold text-[12px] leading-[18px] bg-gradient-to-r from-[#A15EE8] to-[#6D8DFF] bg-clip-text text-transparent">
              常见问题解答
            </span>
          </div>
          
          {/* Heading */}
          <h2 className="font-[PingFang SC] font-medium text-[40px] md:text-[52px] leading-[130%] text-center text-[#0D1216] mb-4">
            我们为您提供保障
          </h2>
          
          {/* FAQ Items */}
          <div className="flex flex-col gap-4 w-full min-w-[600px] max-w-[780px]">
            {/* FAQ Item 1 */}
            <Link href="/docs/win">
              <div className="w-full rounded-[10px] overflow-hidden cursor-pointer hover:shadow-md transition-all">
                <div className="flex justify-between items-center p-5 bg-[#F1F6FF] rounded-[10px]">
                  <h3 className="font-[PingFang SC] font-normal text-[20px] leading-[28px] text-[#0D1216]">
                    Windows系统如何导出微信群聊信息？
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-90">
                    <path d="M9 18L15 12L9 6" stroke="#9F9FB1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
            
            {/* FAQ Item 2 */}
            <Link href="/docs/mac">
              <div className="w-full rounded-[10px] overflow-hidden cursor-pointer hover:shadow-md transition-all">
                <div className="flex justify-between items-center p-5 bg-[#F1F6FF] rounded-[10px]">
                  <h3 className="font-[PingFang SC] font-normal text-[20px] leading-[28px] text-[#0D1216]">
                    Mac系统如何导出微信群聊信息？
                  </h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-90">
                    <path d="M9 18L15 12L9 6" stroke="#9F9FB1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#4D35FF] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">开启智能社群知识管理新体验</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">立即体验AI驱动的社群知识管理工具</p>
          <button className="flex justify-center items-center py-[10px] px-[28px] gap-[10px] w-[144px] h-[50px] bg-white rounded-[8px] mx-auto">
            <span className="font-medium text-[16px] leading-[24px] text-[#4D35FF]">免费开始使用</span>
          </button>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">我们为您提供保障</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="p-6 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-2">NexusKnow是否会存储我的聊天记录？</h3>
              <p className="text-gray-600">我们仅在分析期间临时存储您的聊天记录，分析完成后立即删除原始数据。</p>
            </div>
            <div className="p-6 rounded-lg border border-gray-100">
              <h3 className="text-lg font-medium mb-2">我们如何保护您的数据安全？</h3>
              <p className="text-gray-600">采用银行级加密技术，确保您的数据安全，不会泄露给任何第三方。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="font-bold text-xl flex items-center">
                <span className="text-[#4D35FF] mr-1">Nexus</span>
                <span>Knowledge</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">社群知识管理平台</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h3 className="font-medium mb-2">产品</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <Link href="#">功能</Link>
                  </li>
                  <li>
                    <Link href="#">价格</Link>
                  </li>
                  <li>
                    <Link href="#">集成</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">公司</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <Link href="#">关于我们</Link>
                  </li>
                  <li>
                    <Link href="#">博客</Link>
                  </li>
                  <li>
                    <Link href="#">联系我们</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">资源</h3>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li>
                    <Link href="#">文档</Link>
                  </li>
                  <li>
                    <Link href="#">支持</Link>
                  </li>
                  <li>
                    <Link href="#">隐私政策</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Nexus Knowledge. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
