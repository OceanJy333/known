import { parseSearchReplaceBlocks, applySearchReplaceBlocks } from '../searchReplaceParser'

describe('searchReplaceParser', () => {
  describe('parseSearchReplaceBlocks', () => {
    it('应该正确解析单个 SEARCH/REPLACE 块', () => {
      const diff = `------- SEARCH
const oldFunction = () => {
  console.log('old')
}
=======
const newFunction = () => {
  console.log('new and improved')
}
+++++++ REPLACE`

      const result = parseSearchReplaceBlocks(diff)
      
      expect(result.success).toBe(true)
      expect(result.blocks.length).toBe(1)
      expect(result.blocks[0].searchContent).toBe(`const oldFunction = () => {
  console.log('old')
}`)
      expect(result.blocks[0].replaceContent).toBe(`const newFunction = () => {
  console.log('new and improved')
}`)
    })

    it('应该正确解析多个 SEARCH/REPLACE 块', () => {
      const diff = `------- SEARCH
line1
=======
new line1
+++++++ REPLACE

------- SEARCH
line2
=======
new line2
+++++++ REPLACE`

      const result = parseSearchReplaceBlocks(diff)
      
      expect(result.success).toBe(true)
      expect(result.blocks.length).toBe(2)
      expect(result.blocks[0].searchContent).toBe('line1')
      expect(result.blocks[1].searchContent).toBe('line2')
    })

    it('应该检测未完成的块', () => {
      const diff = `------- SEARCH
incomplete block
=======
missing end marker`

      const result = parseSearchReplaceBlocks(diff)
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('未完成')
    })
  })

  describe('applySearchReplaceBlocks', () => {
    const originalContent = `function hello() {
  console.log('Hello World')
}

function goodbye() {
  console.log('Goodbye')
}`

    it('应该应用精确匹配', () => {
      const blocks = [{
        searchContent: `function hello() {
  console.log('Hello World')
}`,
        replaceContent: `function hello() {
  console.log('Hello Universe')
}`,
        blockIndex: 0
      }]

      const result = applySearchReplaceBlocks(originalContent, blocks)
      
      expect(result.success).toBe(true)
      expect(result.appliedBlocks).toBe(1)
      expect(result.content).toContain('Hello Universe')
      expect(result.content).toContain('Goodbye')
    })

    it('应该使用行级修剪匹配处理空白差异', () => {
      const blocks = [{
        searchContent: `function hello() {
    console.log('Hello World')
}`, // 注意缩进不同
        replaceContent: `function hello() {
  console.log('Hello Universe')
}`,
        blockIndex: 0
      }]

      const result = applySearchReplaceBlocks(originalContent, blocks)
      
      expect(result.success).toBe(true)
      expect(result.appliedBlocks).toBe(1)
      expect(result.content).toContain('Hello Universe')
    })

    it('应该使用块锚点匹配处理多行块', () => {
      const contentWithChanges = `function hello() {
  // 添加了注释
  console.log('Hello World')
  // 更多注释
}

function goodbye() {
  console.log('Goodbye')
}`

      const blocks = [{
        searchContent: `function hello() {
  console.log('Hello World')
}`,
        replaceContent: `function hello() {
  console.log('Hello Universe')
}`,
        blockIndex: 0
      }]

      const result = applySearchReplaceBlocks(contentWithChanges, blocks)
      
      // 块锚点匹配应该能找到函数的开始和结束
      expect(result.appliedBlocks).toBe(1)
      expect(result.content).toContain('Hello Universe')
    })

    it('应该正确处理多个替换', () => {
      const blocks = [
        {
          searchContent: 'Hello World',
          replaceContent: 'Hello Universe',
          blockIndex: 0
        },
        {
          searchContent: 'Goodbye',
          replaceContent: 'See you later',
          blockIndex: 1
        }
      ]

      const result = applySearchReplaceBlocks(originalContent, blocks)
      
      expect(result.success).toBe(true)
      expect(result.appliedBlocks).toBe(2)
      expect(result.content).toContain('Hello Universe')
      expect(result.content).toContain('See you later')
    })

    it('应该报告无法匹配的块', () => {
      const blocks = [{
        searchContent: 'This text does not exist',
        replaceContent: 'replacement',
        blockIndex: 0
      }]

      const result = applySearchReplaceBlocks(originalContent, blocks)
      
      expect(result.success).toBe(false)
      expect(result.appliedBlocks).toBe(0)
      expect(result.errors.length).toBe(1)
      expect(result.errors[0]).toContain('所有匹配策略都失败了')
    })
  })
})