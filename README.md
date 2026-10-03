# 四级随机背词（CET-4 Vocab）

一个四级词汇背单词 PWA，支持随机抽背、艾宾浩斯遗忘曲线复习、错词本。纯 HTML/CSS/JS，零依赖。

## 功能

- 45 天词表，约 2250 词
- 三种题型：英译中 / 中译英 / 混合训练
- 艾宾浩斯复习（1 / 2 / 4 / 7 / 15 / 30 天间隔）
- 错词本（连续答对 3 次自动移出）
- 拼写纠错（编辑距离逐字母对比）
- 离线可用（PWA，Service Worker 缓存）
- Android App（Capacitor 离线封装，和网页版共用同一套前端）

## 使用

- 在线：https://JiaXinTang-xiang.github.io/English-APP/
- 安装到手机：用手机浏览器打开上面的地址，选择「添加到主屏幕」，即可像 App 一样全屏使用、离线可用。

## 开发

```bash
# 词表数据由 export_vocab.py 从 docx 源文件生成
python export_vocab.py
```

- `vocab-data.js`：词表数据（生成产物，45 天词表）
- `export_vocab.py`：从 `四级核心词Day1-Day45/*.docx` 重新生成词表
- `sw.js`：离线缓存，改代码后记得把 `CACHE` 版本号 +1

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

命令行构建 Debug APK（需要 Android SDK、JDK 17 和可用的 Gradle 下载环境）：

```bash
npm run android:sync
cd android
./gradlew assembleDebug
```

生成的 APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`。`www/` 是构建中间目录，不提交到 Git；每次修改网页代码后重新执行 `npm run android:sync` 即可同步到 Android 工程。

当前 App ID 为 `com.jiaxintang.cet4vocab`，后续增加六级时只需扩展词库数据，不需要重写 Android 外壳。
