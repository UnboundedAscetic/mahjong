# 麻将消消乐游戏 - 文件结构说明

基于项目结构分析，这是一份详细的文件清单说明每个文件的作用：

## 📁 核心项目文件

### 📄 根目录配置文件
- **`package.json`** - 项目依赖、脚本命令、元信息配置
- **`angular.json`** - Angular项目构建配置
- **`tsconfig.json`** - TypeScript编译配置
- **`tsconfig.app.json`** - 应用程序TypeScript配置
- **`tsconfig.worker.json`** - Web Worker TypeScript配置
- **`tsconfig.spec.json`** - 测试文件TypeScript配置
- **`browserslist`** - 浏览器兼容性配置
- **`eslint.config.mjs`** - 代码检查规则配置
- **`jest.config.mjs`** - 单元测试配置
- **`setup-jest.ts`** - Jest测试环境设置
- **`logo.svg`** - 项目Logo
- **`LICENSE`** - MIT开源许可证
- **`README.md`** - 项目说明文档
- **`CHANGELOG.md`** - 版本更新日志

## 📁 源代码目录 (`src/`)

### 📄 应用程序入口
- **`index.html`** - HTML入口文件
- **`main.ts`** - Angular应用启动入口
- **`styles.scss`** - 全局样式文件

### 📁 应用程序核心 (`src/app/`)

#### 🎯 主应用组件
- **`app.component.ts`** - 根组件，处理键盘事件、编辑器切换
- **`app.component.html`** - 根组件模板
- **`app.component.scss`** - 根组件样式

#### 🎮 游戏组件 (`src/app/components/`)
- **`game/game-component.component.ts`** - 主游戏控制器
- **`game/game-component.component.html`** - 游戏界面布局
- **`game/game-component.component.scss`** - 游戏组件样式
- **`board/board.component.ts`** - 游戏板渲染和交互逻辑
- **`board/board.component.html`** - SVG游戏板模板
- **`board/board.component.scss`** - 游戏板样式
- **`tile/tile.component.ts`** - 单个麻将牌组件
- **`tile/tile.component.html`** - 麻将牌SVG模板
- **`tile/tile.component.scss`** - 麻将牌样式

#### 🎛️ 界面组件
- **`dialog/dialog.component.ts`** - 对话框基础组件
- **`dialog/dialog.component.html`** - 对话框模板
- **`dialog/dialog.component.scss`** - 对话框样式
- **`settings/settings.component.ts`** - 设置界面组件
- **`settings/settings.component.html`** - 设置界面模板
- **`settings/settings.component.scss`** - 设置界面样式
- **`help/help.component.ts`** - 帮助界面组件
- **`help/help.component.html`** - 帮助文档模板
- **`help/help.component.scss`** - 帮助界面样式
- **`tiles-info/tiles-info.component.ts`** - 麻将牌信息组件
- **`tiles-info/tiles-info.component.html`** - 麻将牌说明模板
- **`tiles-info/tiles-info.component.scss`** - 麻将牌说明样式
- **`choose-layout/choose-layout.component.ts`** - 选择布局组件
- **`choose-layout/choose-layout.component.html`** - 布局选择界面
- **`choose-layout/choose-layout.component.scss`** - 布局选择样式
- **`layout-list/layout-list.component.ts`** - 布局列表组件
- **`layout-list/layout-list.component.html`** - 布局列表模板
- **`layout-list/layout-list.component.scss`** - 布局列表样式
- **`layout-preview/layout-preview.component.ts`** - 布局预览组件
- **`layout-preview/layout-preview.component.html`** - 布局预览模板
- **`layout-preview/layout-preview.component.scss`** - 布局预览样式

#### 🔧 功能组件
- **`image-set-loader/image-set-loader.component.ts`** - 图像集加载器
- **`image-set-loader/svg.ts`** - SVG图像处理工具

#### 📏 自定义指令 (`src/app/directives/`)
- **`defer-load/defer-load.directive.ts`** - 延迟加载指令
- **`defer-load/defer-load-scroll-host.directive.ts`** - 滚动延迟加载指令
- **`defer-load/defer-load.service.ts`** - 延迟加载服务
- **`defer-load/rect.ts`** - 矩形计算工具

#### 🎨 管道 (`src/app/pipes/`)
- **`duration.pipe.ts`** - 时间格式化管道
- **`game-mode.pipe.ts`** - 游戏模式管道
- **`prefix.pipe.ts`** - 前缀处理管道

#### 🎯 数据模型 (`src/app/model/`)
- **`game.ts`** - 游戏核心逻辑类
- **`board.ts`** - 游戏板状态管理
- **`stone.ts`** - 麻将牌数据模型
- **`tiles.ts`** - 麻将牌集合管理
- **`clock.ts`** - 游戏计时器
- **`sound.ts`** - 音效管理
- **`music.ts`** - 背景音乐管理
- **`settings.ts`** - 游戏设置管理
- **`types.ts`** - TypeScript类型定义
- **`consts.ts`** - 游戏常量定义
- **`tilesets.ts`** - 麻将牌图案集定义
- **`languages.ts`** - 多语言支持
- **`hash.ts`** - 哈希工具
- **`draw.ts`** - 绘制工具
- **`mapping.ts`** - 麻将牌映射
- **`tasks.ts`** - 任务管理
- **`indicator.ts`** - 指示器数据
- **`layout-svg.ts`** - 布局SVG处理

##### 🏗️ 布局构建器 (`src/app/model/builder/`)
- **`base.ts`** - 基础构建器
- **`load.ts`** - 布局加载器
- **`random.ts`** - 随机布局生成
- **`solvable.ts`** - 可解布局生成

##### 🎲 随机布局 (`src/app/model/random-layout/`)
- **`random-layout.ts`** - 随机布局生成器
- **`base-layer.ts`** - 基础层生成
- **`upper-layers.ts`** - 上层生成
- **`base-layer-areas.ts`** - 基础层区域
- **`base-layer-checker.ts`** - 基础层检查器
- **`base-layer-lines.ts`** - 基础层线条
- **`base-layer-rings.ts`** - 基础层环状
- **`consts.ts`** - 随机布局常量
- **`utilities.ts`** - 随机布局工具函数

##### 🤖 求解器 (`src/app/model/solver/`)
- **`solver.ts`** - 游戏求解器核心
- **`solver.init.ts`** - 求解器初始化
- **`solver.tools.ts`** - 求解器工具
- **`solver.writer.ts`** - 求解器输出
- **`solver.prune.ts`** - 求解器剪枝
- **`solver.random.ts`** - 随机求解器
- **`solver.types.ts`** - 求解器类型定义
- **`README.md`** - 求解器说明文档

#### 🛠️ 服务层 (`src/app/service/`)
- **`app.service.ts`** - 应用程序核心服务
- **`layout.service.ts`** - 布局管理服务
- **`localstorage.service.ts`** - 本地存储服务
- **`svgdef.service.ts`** - SVG定义服务
- **`worker.service.ts`** - Web Worker服务

#### 🎨 样式系统 (`src/app/style/`)
- **`_variables.scss`** - 样式变量定义
- **`_mixins.scss`** - SCSS混合器

#### 👷 编辑器模块 (`src/app/modules/editor/`)
完整的布局编辑器功能，包含：
- **`components/editor/editor.component.ts`** - 编辑器主组件
- **`components/board/board.component.ts`** - 编辑器游戏板组件
- **`components/layout/layout.component.ts`** - 布局编辑组件
- **`components/manager/manager.component.ts`** - 编辑器管理组件
- **`components/export/export.component.ts`** - 布局导出组件
- **`components/import/import.component.ts`** - 布局导入组件
- **`directives/drop-zone.directive.ts`** - 拖放区域指令
- **`model/`** - 编辑器数据模型
  - `edit-layout.ts` - 编辑布局数据
  - `cell.ts` - 单元格数据
  - `matrix.ts` - 矩阵操作
  - `export.ts` - 导出功能
  - `import.ts` - 导入功能

#### 🏗️ Web Workers (`src/app/worker/`)
- **`create-solve.worker.ts`** - 创建求解Worker
- **`solve.worker.ts`** - 求解Worker
- **`stats-solve.worker.ts`** - 统计求解Worker
- **`create-stats-solve.worker.ts`** - 创建统计求解Worker

## 📁 资源文件 (`src/assets/`)

### 🎮 游戏数据
- **`data/boards.json`** - 内置布局数据

### 🌍 多语言
- **`i18n/`** - 9种语言的翻译文件
  - `en.json` - 英文
  - `de.json` - 德文
  - `jp.json` - 日文
  - `ru.json` - 俄文
  - `fr.json` - 法文
  - `es.json` - 西班牙文
  - `eu.json` - 巴斯克文
  - `pt.json` - 葡萄牙文
  - `nl.json` - 荷兰文

### 🖼️ 图像资源
- **`img/`** - 背景图片 (jpg/webp格式)
  - `bamboo.jpg/.webp` - 竹子背景
  - `blueclouds.jpg/.webp` - 蓝色云朵背景
  - `grayclouds.jpg/.webp` - 灰色云朵背景
  - `grass-1.jpg/.webp` - 草地背景
  - `stones-1.jpg/.webp` - 石头背景
  - `wood.jpg/.webp` - 木纹背景
  - `wood-grain-1.jpg/.webp` - 木纹背景

- **`svg/`** - 麻将牌图案集
  - `classic.svg/.classic/` - 经典麻将牌图案
  - `modern.svg/.modern/` - 现代麻将牌图案
  - `gleitz.svg/.gleitz/` - Gleitz风格图案
  - `animals.svg/.animals/` - 动物主题图案
  - `open-fruits.svg/.open-fruits/` - 水果主题图案
  - `picasso.svg/.picasso/` - Picasso风格图案
  - `recri.svg/.recri/` - Recri风格图案
  - `riichi.svg/.riichi/` - 日本麻将风格
  - `uni.svg/.uni/` - 简约风格图案
  - 其他变体和黑白版本

### 🔊 音效文件
- **`sounds/`** - 游戏音效 (mp3/ogg格式)
  - `select.mp3/.ogg` - 选中音效
  - `match.mp3/.ogg` - 配对成功音效
  - `invalid.mp3/.ogg` - 无效操作音效
  - `over.mp3/.ogg` - 游戏结束音效

### 📱 应用图标
- **`app/`** - PWA应用图标和配置
  - `favicon-16x16.png` - 16x16图标
  - `favicon-32x32.png` - 32x32图标
  - `favicon.ico` - ICO格式图标
  - `apple-touch-icon.png` - 苹果设备图标
  - `android-chrome-192x192.png` - Android图标
  - `manifest.json` - PWA配置文件
  - `browserconfig.xml` - 浏览器配置
  - 其他尺寸和应用商店图标

## 📁 字体文件 (`src/fonts/`)
- **`kulim-park/`** - 主字体 (Kulim Park)
  - `kulim-park-v4-latin-ext_latin-regular.woff2/.woff/.ttf/.eot/.svg` - 主字体文件
  - `css/kulim-park.css` - 字体样式文件
  - `SIL Open Font License.txt` - 字体许可证

- **`fontello/`** - 图标字体
  - `mah.woff2/.woff/.ttf/.eot/.svg` - 麻将游戏图标字体
  - `css/mah.css` - 图标字体样式
  - `config.json` - 图标配置文件

- **`editor/`** - 编辑器字体
  - `editor.woff2/.woff/.ttf/.eot/.svg` - 编辑器专用字体
  - `css/editor.css` - 编辑器字体样式

## 📁 环境配置 (`src/environments/`)
- **`environment.ts`** - 开发环境配置
- **`environment.production.ts`** - 生产环境配置
- **`environment.apps.ts`** - 应用环境配置

## 📁 构建输出
- **`dist/`** - 构建后的静态文件 (运行`npm run build`后生成)

## 📁 资源目录 (`resources/`)

### 📱 移动应用构建
- **`apps/`** - 移动应用相关文件
  - `tauri/` - Tauri桌面应用配置
    - `src/main.rs` - Rust主程序
    - `src/lib.rs` - Rust库文件
    - `Cargo.toml` - Rust依赖配置
    - `tauri.conf.json` - Tauri配置
    - `icons/` - 应用图标
    - `capabilities/` - 应用权限配置

### 🎵 音效构建
- **`sounds/`** - 音效构建脚本和源文件
  - `build.sh` - 音效构建脚本
  - `source/` - 原始音效文件
  - `click-high.mp3` - 高音点击音效
  - `click-low.mp3` - 低音点击音效

### 📖 概念文档
- **`concept/`** - 概念设计和文档
  - `README.md` - 概念说明

## 📁 构建配置
- **`esbuild/`** - ESBuild构建配置文件
- **`custom-build-config.json.dist`** - 自定义构建配置模板

---

## 🎮 游戏功能概览

这个项目是一个功能完整的麻将消消乐游戏，包含：

- **核心玩法**: 麻将牌配对消除
- **63个内置布局**: 多种不同难度的麻将牌排列
- **随机布局生成器**: 无限的游戏可能性
- **13套麻将牌图案**: 经典、现代、水果等多种风格
- **3种难度模式**: 简单、标准、专家
- **辅助功能**: 提示、洗牌、撤销
- **多语言支持**: 9种语言
- **主题系统**: 明暗主题、高对比度
- **游戏保存**: 自动保存进度和最佳时间
- **布局编辑器**: 创建自定义布局
- **求解器**: AI辅助解题
- **多平台支持**: Web、桌面、移动设备

## 🎨 界面修改指南

### 主要界面组件
- **游戏主界面**: `src/app/components/game/game-component.component.html:1-104`
- **游戏板**: `src/app/components/board/board.component.html:28-159`
- **麻将牌**: `src/app/components/tile/tile.component.html:1-6`
- **设置界面**: `src/app/components/settings/settings.component.*`
- **样式变量**: `src/app/style/_variables.scss:1-20`

### 修改建议
1. **麻将牌样式**: 修改 `board.component.html` 中的CSS样式
2. **控制按钮**: 编辑 `game-component.component.html` 中的按钮布局
3. **主题颜色**: 在 `board.component.html:112-152` 中修改暗色主题
4. **字体布局**: 调整 `_variables.scss` 中的变量

这个项目采用模块化架构，每个文件职责明确，便于维护和扩展。核心游戏逻辑与界面展示分离，支持多种主题和语言，是一个功能完整的开源麻将游戏。