---
layout: post
title: docker部署whisper
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# Whisper ASR Web Service 部署指南

## 镜像信息

官方镜像：  
`onerahmet/openai-whisper-asr-webservice`

文档地址：  
https://ahmetoner.com/whisper-asr-webservice/environmental-variables/#configuring-the-model

---

## 环境变量配置

| 变量名                   | 说明                   | 示例值                                                       |
| ------------------------ | ---------------------- | ------------------------------------------------------------ |
| `ASR_ENGINE`             | 语音识别引擎           | `openai_whisper`, `faster_whisper`, `whisperx`               |
| `ASR_MODEL`              | 模型名称               | `tiny`, `base`, `small`, `medium`, `large-v3`（或 `large`）等 |
| `ASR_MODEL_PATH`         | 自定义模型存储路径     | `/data/whisper`                                              |
| `ASR_DEVICE`             | 运行设备               | `cuda`（GPU）或 `cpu`                                        |
| `MODEL_IDLE_TIMEOUT`     | 模型空闲卸载超时（秒） | `300`（设为 `0` 则常驻内存）                                 |
| `NVIDIA_VISIBLE_DEVICES` | 指定 GPU 设备          | `0`                                                          |

> **说明**：  
> - `.en` 后缀模型（如 `base.en`）专为英文优化。  
> - `distil-*` 模型仅支持 `faster_whisper` 和 `whisperx`。  
> - 默认 `ASR_DEVICE=cuda`（若 GPU 可用），否则为 `cpu`。  
> - 默认量化：GPU 用 `float32`，CPU 用 `int8`（可通过 `ASR_QUANTIZATION` 调整）。

---

## 启动命令示例

### 1. GPU 模式（推荐）

```bash
docker run -d \
  --gpus all \
  --privileged \
  --name whisper \
  -p 9000:9000 \
  -e ASR_ENGINE=faster_whisper \
  -e ASR_MODEL=medium \
  -e ASR_DEVICE=cuda \
  -e NVIDIA_VISIBLE_DEVICES=0 \
  -v /home/user/whisper/cache:/root/.cache/whisper \
  -v /home/user/whisper/app:/app/app \
  openai-whisper-asr-webservice:latest-gpu
```

## 镜像管理

### 打标签并推送至私有仓库

```bash
# 为本地镜像打标签
docker tag openai-whisper-asr-webservice:v1.0.0 172.16.1.133:8888/test/openai-whisper-asr-webservice:v1.0.0
docker tag d970eb80610d 172.16.1.133:8888/onerahmet/openai-whisper-asr-webservice:latest-gpu

# 推送
docker push 172.16.1.133:8888/test/openai-whisper-asr-webservice:v1.0.0
```

### 从运行容器创建新镜像

```bash
docker commit 12c7356e8557 172.16.1.133:8888/test/openai-whisper-asr-webservice:v1.1.0
```

---

## 依赖说明（如需手动构建）

若需在容器内编译 FFmpeg 相关功能，可安装以下依赖：

```bash
apt-get update && apt-get install -y \
  libdc1394-dev \
  libdrm-dev \
  libiec61883-dev \
  libchromaprint-dev \
  frei0r-plugins-dev \
  libx264-dev
```

> **提示**：官方镜像通常已包含必要依赖，无需额外安装。

---

## 音频预处理示例（提取音频）

```bash
ffmpeg -i "111.mp4" -vn -c:a copy "111.aac"
```

适用于将视频转为纯音频以便 ASR 服务处理。
