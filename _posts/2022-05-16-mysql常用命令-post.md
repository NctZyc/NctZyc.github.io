---
layout: post
title: mysql命令
date: 2022-05-16 00:00:00 +0800
category: tutorial
thumbnail: /style/image/global/thumbnail.png
icon: code
---


* 目录
{:toc}
> mysql命令

## 一、常用命令

10.导入和导出

（1）导入sql脚本

```
source 脚本文件
```

（2）导出所有数据库

```
mysqldump -u 用户名 -p --all-databases > 导出的文件名
```

（3）导出指定的数据库

```
mysqldump -u 用户名 -p 数据库名 > 导出的文件名
```

（4）导出指定数据库排除某些表

```
mysqldump -u 用户名 -p 数据库名
```

