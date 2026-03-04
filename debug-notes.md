# Debug Notes

## Issue: AppDemo 页面中文显示为 Unicode 转义序列
- 侧边栏文字显示为 \u641c\u7d22 等
- 状态标签显示为 \u5f85\u786e\u8ba4
- 原因：文件中使用了 Unicode 转义序列而非直接中文字符
- 解决：重写 AppDemo.tsx 使用直接中文字符
