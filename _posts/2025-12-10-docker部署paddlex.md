---
layout: post
title: docker部署paddlex
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# PaddleX Docker 部署指南

## 镜像说明

支持以下镜像来源：

- 官方镜像（百度云）：  
  `ccr-2vdh3abv-pub.cnc.bj.baidubce.com/paddlex/paddlex:paddlex3.3.4-paddlepaddle3.2.0-gpu-cuda11.8-cudnn8.9-trt8.6`

---

## 安装插件（首次使用建议安装）

进入容器后执行：

```bash
# 安装高性能推理插件（GPU）
paddlex --install hpi-gpu

# 安装服务化部署插件
paddlex --install serving
```

> 插件只需安装一次，配置会持久化到挂载目录。

---

## 启动容器

```bash
docker run -it -d \
  --gpus all \
  --name paddlex \
  -w /workspace \
  -v /home/user/paddlex/configs:/root/PaddleX/paddlex/configs \
  -v /home/user/paddlex/.paddlex:/root/.paddlex/ \
  --shm-size=8g \
  --network=host \
  ccr-2vdh3abv-pub.cnc.bj.baidubce.com/paddlex/paddlex:paddlex3.3.4-paddlepaddle3.2.0-gpu-cuda11.8-cudnn8.9-trt8.6
```

### 参数说明

| 参数             | 说明                                       |
| ---------------- | ------------------------------------------ |
| `--gpus all`     | 启用所有 GPU 设备                          |
| `-w /workspace`  | 设置工作目录                               |
| `-v ...`         | 挂载配置与缓存目录，实现持久化             |
| `--shm-size=8g`  | 共享内存设为 8GB（推荐 ≥4G，用于大图处理） |
| `--network=host` | 使用主机网络，便于直接通过端口访问服务     |

> **注意**：使用 `--network=host` 时，容器内服务绑定的端口即为主机端口，无需 `-p` 映射。

---

## 启动服务（在容器内执行）

### 基本命令格式

```bash
paddlex --serve \
  --pipeline <产线名称或配置文件路径> \
  [--port <端口>] \
  [--host <IP>] \
  [--device <cpu|gpu>] \
  [--use_hpip] \
  [--hpi_config <配置文件路径>]
```

### 常用服务示例

```bash
# 启动 PP-StructureV3 文档结构化服务
paddlex --serve --port 8089 --pipeline PP-StructureV3

# 启动 OCR 文字识别服务
paddlex --serve --port 8081 --pipeline OCR

# 启动文档预处理服务（启用高性能插件）
paddlex --serve --port 8083 --pipeline doc_preprocessor --use_hpip
```

### 参数说明

| 参数           | 默认值    | 说明                                                       |
| -------------- | --------- | ---------------------------------------------------------- |
| `--pipeline`   | 必填      | 产线名称（如 `OCR`, `PP-StructureV3`）或自定义配置文件路径 |
| `--port`       | `8080`    | 服务监听端口                                               |
| `--host`       | `0.0.0.0` | 绑定 IP，允许外部访问                                      |
| `--device`     | 自动检测  | `gpu`（如有）或 `cpu`                                      |
| `--use_hpip`   | 无        | 启用高性能推理插件（需先安装）                             |
| `--hpi_config` | -         | 指定 HPI 自定义配置文件路径                                |

---

## 目录说明

- **`/home/user/paddlex/configs`**  
  用于存放自定义产线配置文件（YAML），可被 `--pipeline` 引用。

- **`/home/user/paddlex/.paddlex`**  
  存放插件、模型缓存、授权信息等，确保服务重启后无需重复安装。

---

## 访问服务

服务启动后，可通过以下方式调用：

```
http://<服务器IP>:<端口>/predict
```
