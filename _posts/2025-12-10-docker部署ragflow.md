---
layout: post
title: docker部署ragflow
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# RAGFlow 部署与沙盒配置指南

## 前置条件

### 调整内核参数

```bash
# 临时设置（重启后失效）
sudo sysctl -w vm.max_map_count=262144

# 永久生效：编辑 /etc/sysctl.conf
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

> 该参数对 Elasticsearch 等组件正常运行至关重要。

---

## 项目部署

### 克隆与启动（GPU 版）

```bash
cd /home/user/sourceCode/ragflow/docker

# 启动服务
docker compose -f docker-compose-gpu.yml up -d

# 查看日志
docker logs -f ragflow-server

# 停止服务（保留数据）
docker compose -f docker-compose-gpu.yml down

# 停止并**彻底清除数据**（慎用）
docker compose -f docker-compose-gpu.yml down -v
```

> 注意：`-v` 会删除所有容器卷，包括数据库、MinIO 等持久化数据。

---

## 沙盒（Sandbox）功能启用

### 1. 拉取基础镜像

```bash
docker pull infiniflow/sandbox-base-python:latest
# 如需 Node.js 环境（可选）
docker pull infiniflow/sandbox-base-nodejs:latest
```

### 2. 修改 `.env` 配置

在 `ragflow/docker/.env` 中启用沙盒并设置运行时参数：

```ini
# 启用沙盒
SANDBOX_ENABLED=1
SANDBOX_HOST=sandbox-executor-manager
SANDBOX_EXECUTOR_MANAGER_IMAGE=infiniflow/sandbox-executor-manager:latest
SANDBOX_EXECUTOR_MANAGER_POOL_SIZE=3
SANDBOX_BASE_PYTHON_IMAGE=infiniflow/sandbox-base-python:latest
SANDBOX_EXECUTOR_MANAGER_PORT=9385
SANDBOX_ENABLE_SECCOMP=false
SANDBOX_MAX_MEMORY=256m
SANDBOX_TIMEOUT=100s
```

### 3. 启用 Compose Profiles

取消注释并选择对应文档引擎的配置（以 Infinity 为例）：

```ini
COMPOSE_PROFILES=infinity,sandbox
```

> 可选引擎：`elasticsearch`、`infinity`、`opensearch`

### 4. 配置本地解析（/etc/hosts）

```bash
echo "127.0.0.1 sandbox-executor-manager" | sudo tee -a /etc/hosts
```

> 如需本地开发调试，建议同时添加：
> ```
> 127.0.0.1 es01 infinity mysql minio redis sandbox-executor-manager
> ```

---

## 安装 gVisor（沙盒安全运行时）

### 自动安装脚本

```bash
(
  set -e
  ARCH=$(uname -m)
  URL=https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}
  wget ${URL}/runsc ${URL}/runsc.sha512 \
       ${URL}/containerd-shim-runsc-v1 ${URL}/containerd-shim-runsc-v1.sha512
  sha512sum -c runsc.sha512 -c containerd-shim-runsc-v1.sha512
  rm -f *.sha512
  chmod a+rx runsc containerd-shim-runsc-v1
  sudo mv runsc containerd-shim-runsc-v1 /usr/local/bin
)
```

### 注册为 Docker 运行时

```bash
# 安装运行时
sudo /usr/local/bin/runsc install

# 重载 Docker 配置
sudo systemctl reload docker
```

### 验证安装

```bash
docker run --rm --runtime=runsc hello-world
```

> 成功输出 "Hello from Docker!" 表示 gVisor 已正确集成。

---

## 项目资源

- GitHub 仓库：https://github.com/infiniflow/ragflow  
- 在线演示：https://demo.ragflow.io
