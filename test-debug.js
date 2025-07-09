// 简单的测试脚本来验证API调用
const testQuestion = "产品设计的核心原则是什么？";
const testKnowledgeBase = [
  {
    id: 'note-1',
    title: 'AI产品设计的核心原则',
    content: 'AI产品设计的核心原则包括以用户为中心、透明性和可解释性、渐进式增强、错误处理和恢复等。',
    summary: '详细介绍了AI产品设计的四个核心原则：以用户为中心、透明性、渐进式增强和错误处理。',
    tags: ['tag-1', 'tag-2'],
    category: 'cat-1'
  },
  {
    id: 'note-2',
    title: '用户体验设计原则',
    content: '用户体验设计需要关注用户的真实需求，提供直观的交互界面。',
    summary: '用户体验设计的基本原则和方法',
    tags: ['tag-2'],
    category: 'cat-1'
  }
];

console.log('测试数据准备完成:', {
  question: testQuestion,
  knowledgeBaseSize: testKnowledgeBase.length,
  knowledgeBaseSample: testKnowledgeBase.map(note => ({
    id: note.id,
    title: note.title
  }))
});

console.log('请在浏览器中打开开发者工具，然后在沉思模式下提问:', testQuestion);
console.log('期望看到的日志:');
console.log('1. 📡 [输出节点] 准备发送API请求');
console.log('2. 🚀 [输出节点API] 收到请求');
console.log('3. 📤 [召回] 发送召回结果到前端');
console.log('4. 📋 [输出节点] 召回卡片详情');
console.log('5. 🎯 [召回处理] 准备添加卡片');
console.log('6. ✅ [召回处理] 卡片添加完成');