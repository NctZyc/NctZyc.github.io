---
layout: post
title: docker部署dify
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
# Dify Docker 部署指南

## 准备工作

确保系统已安装 Docker 和 Docker Compose，并满足最低要求：
- CPU ≥ 2 核
- 内存 ≥ 4 GiB

## 部署步骤

### 1. 进入部署目录
```bash
cd /home/user/sourseCode/dify/docker
```

### 2. 生成配置文件
```bash
cp .env.example .env
```
> 如需自定义配置（如端口、模型、存储路径等），请编辑 `.env` 文件。

### 3. 启动服务
```bash
docker compose -f docker-compose.yaml up -d
```

### 4. 访问 Dify
启动完成后，浏览器访问：
```
http://localhost/install
```
按页面提示完成初始化设置。

## 关闭服务

### 正常关闭（保留数据）
```bash
docker compose -f docker-compose.yaml down
```

### 彻底清理（删除所有容器卷和数据）
```bash
docker compose -f docker-compose.yaml down -v
```
> **注意**：`-v` 参数会删除所有持久化数据（包括数据库、向量库等），请谨慎使用。
