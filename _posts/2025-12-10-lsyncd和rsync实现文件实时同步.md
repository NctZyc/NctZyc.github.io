---
layout: post
title: lsyncd和rsync实现文件实时同步
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
### 一、前置准备

1. ​	环境要求：

   源主机和目的主机都要安装rsync，需要检测文件变化的主机安装lsyncd

   rsync安装方式

   yum install epel-release -y && yum install rsync -y

   lsyncd安装方式：

   yum install epel-release -y && yum install lsyncd -y

2. 软件说明：

   rsync 用于同步文件

   lsyncd 用于监控文件变化

3. 配置说明：

   源主机启动lsyncd就行，目的主机需要开启rsync，并采用后台守护方式进行启动	

### 二、目的主机rsync配置（要备份到哪台服务器/etc/rsyncd.conf）

```shell
# 以 root 用户启动进程
uid = root
gid = root
# 禁锢推送的数据至某个目录, 不允许跳出该目录
use chroot = no
# 最大连接数
max connections = 20
#指定rsync进程的pid文件的路径和名称
pid file = /var/run/rsyncd.pid
log file = /var/log/rsync.log
lock file = /var/run/rsyncd.lock
exclude = lost+found/
reverse lookup = no
timeout = 900
dont compress   = *.gz *.tgz *.zip *.z *.Z *.rpm *.deb *.bz2

#备份模块名称
[ggly]
	#备份目录位置
	path = /home/lutong/product/ggly/ggly-epg-74100/webapps/
	read only = no
	#虚拟用户名
	auth users = ggly_backup
	#虚拟用户名和密码密钥文件
	secrets file = /etc/rsyncd.password
	list = no
```

创建秘钥文件注意点：
格式：账号:密码
文件权限：600

```shell
echo 'ggly_backup:YjHT9d21qKol' > /etc/rsyncd.password && chmod 600 /etc/rsyncd.password
```

### 三、源主机配置（备份哪个服务器的业务/etc/lsyncd.conf）

```shell
settings {
    logfile = "/var/log/lsyncd/lsyncd.log",
    pidfile = "/var/run/lsyncd.pid",
    statusFile = "/var/log/lsyncd/lsyncd.status",
    statusInterval = 5,
    nodaemon = false,
    inotifyMode = "CloseWrite or Modify",
    maxProcesses = 5,
    maxDelays = 1,
    inist = ture,
}

--里面是定义同步参数，一般第一个参数指定lsyncd以什么模式运行，有rsync、rsyncssh、direct三种模式
sync {
	--目录间同步，使用rsync模式
    default.rsync,
	--要备份的业务路径，同步的源目录，即监控的目录。
    source = "/home/lutong/product/ggly/ggly-epg-74100/webapps",
	--同步的目标目录
    target = "ggly_backup@192.168.56.108::ggly",
    exclude = { "workspace/**", "logs/**" },
    delay = 3,
    rsync = {
		--rsync命令的绝对路径
        binary = "/usr/bin/rsync",
		--递归,即同步子目录的内容
        archive = true,
		--传输过程中压缩文件数据,相对其他压缩工具而言，它可以获得更好的压缩率，但是需要消耗CPU资源
        compress = true,
		--增加在传输过程中获得的信息量，提供有关正在传输文件的信息
        verbose = true,
		--密码文件路径
        password_file = "/etc/rsyncd.password",
    }
}
```

创建秘钥文件注意点(这里只是密码)：
格式：密码
文件权限：600

```shell
echo 'YjHT9d21qKol' > /etc/rsyncd.password && chmod 600 /etc/rsyncd.password
```

### 四、开放目标机器873端口，目标机启动rsync，源主机启动lsyncd

```shell
//开放端口
firewall-cmd --zone=public --add-port=873/tcp --permanent
//重载生效
firewall-cmd --reload
//目标主机守护线程启动rsync
rsync --daemon
//源主机启动lsyncd
systemctl start lsyncd
//源主机lsyncd设置开机自启
systemctl enable lsyncd
//目标机器设rsyncd开机自启
systemctl enable rsyncd
```

### 五、结语
