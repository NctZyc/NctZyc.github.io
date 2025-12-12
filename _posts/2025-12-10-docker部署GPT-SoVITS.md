---
layout: post
title: docker部署GPT-SoVITS
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# GPT-SoVITS Docker 部署指南

## 构建镜像

```bash
docker build -t nctzyc/gpt-sovits:latest .
```

在 Dockerfile 中配置 pip 镜像源（推荐使用阿里云）：

```dockerfile
# 配置pip镜像源
RUN mkdir -p /root/.pip && \
    printf "[global]\nindex-url = https://mirrors.aliyun.com/pypi/simple/\n" > /root/.pip/pip.conf
```

## 运行容器

```bash
docker run --rm -it \
  --gpus=all \
  --env=is_half=False \
  --volume=/home/user/gpt-sovits/workspace/output:/workspace/output \
  --volume=/home/user/gpt-sovits/workspace/logs:/workspace/logs \
  --volume=/home/user/gpt-sovits/workspace/GPT_weights_v3:/workspace/GPT_weights_v3 \
  --volume=/home/user/gpt-sovits/workspace/SoVITS_weights_v3:/workspace/SoVITS_weights_v3 \
  --volume=/home/user/gpt-sovits/workspace/input:/workspace/input \
  --volume=/home/user/gpt-sovits/workspace/G2PWModel:/workspace/GPT_SoVITS/text/G2PWModel \
  --workdir=/workspace \
  -p 9880:9880 \
  -p 9871:9871 \
  -p 9872:9872 \
  -p 9873:9873 \
  -p 9874:9874 \
  --shm-size="16G" \
  -d nctzyc/gpt-sovits:latest
```

### 挂载说明

| 宿主机路径                                          | 容器内路径                             | 用途                       |
| --------------------------------------------------- | -------------------------------------- | -------------------------- |
| `/home/user/gpt-sovits/workspace/output`            | `/workspace/output`                    | 推理输出                   |
| `/home/user/gpt-sovits/workspace/logs`              | `/workspace/logs`                      | 日志文件                   |
| `/home/user/gpt-sovits/workspace/GPT_weights_v3`    | `/workspace/GPT_weights_v3`            | GPT 模型（`.ckpt` 文件）   |
| `/home/user/gpt-sovits/workspace/SoVITS_weights_v3` | `/workspace/SoVITS_weights_v3`         | SoVITS 模型（`.pth` 文件） |
| `/home/user/gpt-sovits/workspace/input`             | `/workspace/input`                     | 输入音频                   |
| `/home/user/gpt-sovits/workspace/G2PWModel`         | `/workspace/GPT_SoVITS/text/G2PWModel` | G2PW 模型                  |

> **注意**：若使用精简镜像，还需额外挂载预训练模型目录：
>
> ```bash
> --volume=/home/user/gpt-sovits/workspace/pretrained_models:/workspace/GPT_SoVITS/pretrained_models
> ```

## 模型下载

```bash
# 主模型
git clone https://huggingface.co/lj1995/GPT-SoVITS

# G2PW 模型
git clone https://huggingface.co/alextomcat/G2PWModel
```
