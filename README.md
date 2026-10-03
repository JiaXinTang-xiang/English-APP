# 四级随机背词（CET-4 Vocab）

一个基于 Vue 3 + Vite 的四级词汇背单词 PWA，支持随机抽背、艾宾浩斯遗忘曲线复习、错词本和统一音频接口。

## 功能

- 45 天词表，约 2250 词
- 三种题型：英译中 / 中译英 / 混合训练
- 艾宾浩斯复习（1 / 2 / 4 / 7 / 15 / 30 天间隔）
- 错词本（连续答对 3 次自动移出）
- 拼写纠错（编辑距离逐字母对比）
- 离线可用（PWA，Service Worker 缓存）
- Android App（Capacitor 离线封装，和网页版共用同一套前端）
- Supabase Cloud 登录与学习进度同步（配置后启用，未登录仍可离线使用）

## 使用

- 在线：https://JiaXinTang-xiang.github.io/English-APP/
- 安装到手机：用手机浏览器打开上面的地址，选择「添加到主屏幕」，即可像 App 一样全屏使用、离线可用。

## 开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build:web
```

- `src/views/`：首页、今日任务、训练、错词本和总结页面
- `src/router/index.js`：Vue Router Hash 路由
- `src/stores/learning.js`：学习进度与训练状态
- `src/services/storage.js`：Web LocalStorage / Android Preferences 统一存储
- `src/services/supabase.js`：Supabase 客户端（仅使用公开 anon key）
- `src/services/cloudSync.js`：登录和学习数据同步接口
- `supabase/schema.sql`：Supabase 表结构与 RLS 安全策略
- `src/services/audio.js`：统一音频播放模块
- `public/vocab-data.js`：网页构建使用的词表数据
- `vocab-data.js`：由文档生成的源词表数据
- `export_vocab.py`：从 `四级核心词Day1-Day45/*.docx` 重新生成词表
- `public/sw.js`：离线缓存
- `public/audio/us`、`public/audio/uk`：统一美式/英式 MP3 音频目录

## Android App

项目现在同时保留两种形态：

- GitHub Pages：直接部署仓库根目录，继续作为网页版和试用版
- Android：使用 Capacitor 把网页资源封装成离线 App，暂不需要后端、登录或账号

首次准备 Android 工程：

```bash
npm install
npm run android:sync
```

然后用 Android Studio 打开 `android/`，连接 Android 手机后运行，或在 Android Studio 中生成 APK。

命令行构建 Debug APK（Capacitor 8 需要 Android SDK 36、JDK 21 和可用的 Gradle 下载环境）：

```bash
npm run android:apk
```

生成的 APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`。`dist/` 是 Vite 构建目录，不提交到 Git；每次修改 Vue 代码后重新执行 `npm run android:sync` 即可同步到 Android 工程。

当前 App ID 为 `com.jiaxintang.cet4vocab`，后续增加六级时只需扩展词库数据，不需要重写 Android 外壳。

## Supabase Cloud

1. 在 Supabase 控制台 SQL Editor 执行 `supabase/schema.sql`。
2. 复制项目 URL 和公开 anon key，创建本地 `.env`（不要提交）：

```bash
cp .env.example .env
```

3. 在 `.env` 填入：

```text
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的公开anon-key
```

4. Vercel 项目 Settings → Environment Variables 中添加同名变量，然后重新部署。

`service_role` key 不能放进 Vue、Vercel 前端或 Android App。RLS 策略保证每个用户只能访问自己的进度。
