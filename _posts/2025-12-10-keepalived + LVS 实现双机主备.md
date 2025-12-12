---
layout: post
title: keepalived + LVS 实现双机主备
date: 2025-12-10 09:00:00 +0800
category: 笔记
thumbnail: /style/image/thumbnail.png
icon: note
typora-copy-images-to: ..\style\image
---

* 目录
{:toc}
### 一、安装lvs的管理集群的工具

```shell
yum install -y ipvsadm
```

### 二、安装keepalived

```shell
yum install -y curl gcc openssl-devel libnl3-devel net-snmp-devel
yum install -y keepalived
```

### 三、修改配置文件/etc/keepalived/keepalived.conf( 注意：track_script 与 { 中间只能是一个空格)

```shell
! Configuration File for keepalived

global_defs {
   # 路由id：当前安装keepalived的节点主机标识符，保证全局唯一（修改）
   router_id LVS_MASTER
   vrrp_skip_check_adv_addr
   vrrp_strict
   vrrp_garp_interval 0
   vrrp_gna_interval 0
   script_user root
   enable_script_security
}

vrrp_script check_nginx
{
	#检查ng是否存活的脚本自己写
    script "/etc/keepalived/check_nginx.sh"
    interval 3
	timeout 5
    weight -20
}

# vrrp_instance vrrp实例（基于VRRP的服务器节点）vrrp_instance是主机内配置的实例名称，不同主机可以不一致
vrrp_instance VI_1 {
    # 表示状态是MASTER主机还是备用机BACKUP（修改）
    state MASTER
	# 该实例要绑定的网卡（修改）
    interface enp0s8
	# 保证主备节点一致即可（修改）
    virtual_router_id 51
	# 权重，master权重一般高于backup，如果有多个，那就是选举，谁的权重高，谁就当选（修改）
    priority 100
	# 主备之间同步检查时间间隔，单位秒
    advert_int 1
	# 认证权限密码，防止非法节点进入
    authentication {
        auth_type PASS
        auth_pass 1111
    }
	#虚拟ip，用户访问业务的ip,通过这个ip转发到多个真实业务ip（修改）
    virtual_ipaddress {
        192.168.56.103
    }
	
	track_script {
        check_nginx
    }
}

# 配置集群地址访问的 IP + 端口，用户要访问的ip和端口，类似ng监听（修改）
virtual_server 192.168.56.103 9001 {
	# 健康检查的时间， 单位：秒
    delay_loop 6
	# 配置负载均衡的算法，默认是轮询
    lb_algo rr
	# 设置LVS的模式 NAT|TUN|DR
    lb_kind DR
	# 设置会话持久化的时间
    persistence_timeout 0
	# 协议 -t
    protocol TCP

	# 负载均衡的真是服务器，也就是nginx节点的具体的真实的ip地址	（修改）
	real_server 192.168.56.107 9001 {
        weight 1
    }
}
```

####################################检测脚本###############################

```shell
#!/bin/bash
count=`ps aux | grep -v grep | grep nginx.conf | wc -l`
if [ $count -gt 0 ]; then
    exit 0
else
    exit 1
fi
```

####################################检测脚本###############################
 检测脚本要加可执行权限
 chmod 744 check_nginx.sh

###  四、启动对应的nginx

```shell
/home/nginx-1.23.4/sbin/nginx -c /home/nginx-1.23.4/conf/nginx.conf
```

###  五、启动keepalived并加入开机自启

```shell
systemctl start keepalived   //启动keepalived
systemctl enable keepalived  //加入开机启动keepalived
systemctl restart keepalived  //重新启动keepalived
systemctl status keepalived   //查看keepalived状态
```

### 六、通过ip addr命令查看虚拟IP是否绑定在对应网卡上

正常：主机上对应网卡出现虚拟ip、备份机网卡不出现
异常：主备机对应网卡都出现虚拟ip
异常解决方案：
	sudo tcpdump -i enp0s8 vrrp -n
	抓包绑定了vip的网卡的报文，发现主备机都在往在轮询往224.0.0.18（vrrp的组播地址）发送报文
	理论上来说，主机处于活跃状态的时候，备份机收到报文之后是不会发送组播消息的，这个很明显就是备份机没收到主机的组播报文


```shell
firewall开启组播通信
firewall-cmd --direct --permanent --add-rule ipv4 filter INPUT 0 --in-interface enp0s8 --destination 224.0.0.18 --protocol vrrp -j ACCEPT
firewall-cmd --reload
```
### 七、查看keepalived状态

```shell
systemctl enable keepalived
```

### 八、查看ipvsadm策略

```shell
ipvsadm -Ln
```

