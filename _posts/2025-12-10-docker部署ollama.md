---
layout: post
title: docker部署ollama
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# Ollama Docker 部署与模型导入指南

## 1. 部署 Ollama 容器

### GPU 模式（推荐）

```bash
docker run -it -d \
  --gpus all \
  --name ollama \
  -v /home/user/ollama/data:/root/.ollama \
  -p 11434:11434 \
  ollama/ollama:latest
```

> 端口 `11434` 是 Ollama 默认 API 端口，可根据需要调整。

---

## 2. 从本地 Safetensors 模型创建 Ollama 模型

### 方法一：使用 `FROM <目录>`（推荐）

1. **准备模型目录**  
   确保模型权重（`.safetensors`）和配置文件（`config.json`、`tokenizer` 等）位于同一目录，例如 `/home/user/models/Qwen2.5-VL-7B-Instruct`。

2. **创建 `Modelfile`**  
   在模型目录中新建文件 `Modelfile`，内容如下：

   ```dockerfile
   FROM .
   ```

   > 若模型目录路径非当前目录，则写为：  
   > `FROM /absolute/path/to/model`

3. **构建模型**

   ```bash
   # 进入容器
   docker exec -it ollama bash

   # 执行创建命令（在容器内）
   ollama create Qwen2.5-VL-7B-Instruct -f Modelfile
   ```

4. **运行模型**

   ```bash
   ollama run Qwen2.5-VL-7B-Instruct
   ```

> **说明**：Ollama 会自动检测目录中的 `.safetensors` 权重并尝试加载，但仅支持其内置转换器支持的模型结构（如 Llama、Qwen 等）。对于不支持的模型，需先转换为 GGUF 格式。

---

## 3. 将 Safetensors 模型转换为 GGUF（适用于非原生支持模型）

> 适用于 Ollama 无法直接加载的模型（如 Qwen2.5-VL 等多模态模型）。

### 步骤 1：安装依赖

```bash
pip install -U transformers accelerate sentencepiece einops
```

### 步骤 2：克隆并编译 `llama.cpp`

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make -j
```

> 确保系统已安装 `cmake`、`gcc` 等构建工具。

### 步骤 3：转换模型为 GGUF

```bash
# 转换为 FP16（未量化）
python3 convert_hf_to_gguf.py \
  --input /home/user/ollama-new/data/Qwen2.5-VL-7B-Instruct \
  --output qwen2.5-vl-7b-f16.gguf \
  --outtype f16
```

> 注意：`--input` 应指向**模型目录**（含 `config.json` 和 `.safetensors` 文件），而非单个 `.safetensors` 文件。

### 步骤 4：量化（可选但推荐）

```bash
./quantize qwen2.5-vl-7b-f16.gguf qwen2.5-vl-7b-q4_0.gguf q4_0
```

常用量化类型：`q4_0`、`q4_k_m`、`q5_k_m`、`q8_0`。

### 步骤 5：在 Ollama 中使用 GGUF 模型

1. 将 `.gguf` 文件复制到容器内：

   ```bash
   docker cp qwen2.5-vl-7b-q4_0.gguf ollama:/root/
   ```

2. 在容器内创建 `Modelfile`：

   ```dockerfile
   FROM /root/qwen2.5-vl-7b-q4_0.gguf
   ```

3. 创建并运行模型：

   ```bash
   ollama create qwen2.5vl-7b -f Modelfile
   ollama run qwen2.5vl-7b
   ```

---

## 4. 辅助命令

```bash
# 查看模型信息
ollama show --modelfile qwen2.5vl:7b

# 列出本地模型
ollama list

# 查看模型详细信息
ollama show <model_name>
```

---

## 注意事项

- Ollama 对多模态模型（如 Qwen-VL、LLaVA）的支持依赖于底层 `llama.cpp` 版本，请确保使用最新版。
- 直接使用 `FROM .` 加载 Safetensors 模型仅适用于 Ollama 内置支持的架构。
- 转换前请确认 `llama.cpp` 的 `convert_hf_to_gguf.py` 支持目标模型（如 `--model-type qwen2.5-vl`）。
- 模型路径必须为**绝对路径**或容器内可访问路径。
