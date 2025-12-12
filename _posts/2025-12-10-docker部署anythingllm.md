---
layout: post
title: docker部署anythingllm
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# AnythingLLM Docker 部署指南

## 部署命令

```bash
docker run -it -d \
  --privileged \
  --gpus all \
  --add-host=host.docker.internal:host-gateway \
  --name anythingllm \
  -p 3001:3001 \
  -v /home/user/anythingllm/storage/assets:/app/server/storage/assets \
  -v /home/user/anythingllm/storage/documents:/app/server/storage/documents \
  -v /home/user/anythingllm/storage/models:/app/server/storage/models \
  mintplexlabs/anythingllm:latest
```

## 挂载说明

| 宿主机路径                                 | 容器内路径                      | 用途                   |
| ------------------------------------------ | ------------------------------- | ---------------------- |
| `/home/user/anythingllm/storage/assets`    | `/app/server/storage/assets`    | 存储用户上传的资源文件 |
| `/home/user/anythingllm/storage/documents` | `/app/server/storage/documents` | 存储文档数据           |
| `/home/user/anythingllm/storage/models`    | `/app/server/storage/models`    | 存储本地模型文件       |

## 访问服务

- Web 界面：`http://localhost:3001`
- API 文档：`http://localhost:3001/api/docs/`
