# vm setup

sudo apt update
sudo apt upgrade -y
sudo reboot

# install git/curl/node

sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# verify

node --version
npm --version

# clone only worker folder

git clone --filter=blob:none --sparse https://github.com/callmedugan/Linea.git
cd Linea
git sparse-checkout set worker

# worker install/build

cd worker
npm install
npm run build

# create dedicated worker user

sudo useradd --system --no-create-home --shell /usr/sbin/nologin linea-worker
sudo usermod -aG ubuntu linea-worker
id linea-worker

# current worker uid

# 999

# env - injected by systemd

sudo mkdir -p /etc/linea
sudo nano /etc/linea/worker.env
sudo chown root:linea-worker /etc/linea/worker.env
sudo chmod 640 /etc/linea/worker.env

# test worker access

sudo -u linea-worker test -r /home/ubuntu/Linea/worker && echo "worker readable"
sudo -u linea-worker test -r /etc/linea/worker.env && echo "env readable"

# systemd service

sudo nano /etc/systemd/system/linea-worker.service

# add under [Service]

# User=linea-worker

# Group=linea-worker

sudo systemctl daemon-reload
sudo systemctl enable --now linea-worker

# check worker

sudo systemctl status linea-worker --no-pager
ps -o user,group,pid,cmd -C node

# worker logs

sudo journalctl -u linea-worker -f

# recent worker logs

sudo journalctl -u linea-worker -n 100 --no-pager

# update/deploy

cd ~/Linea
git pull
cd worker
npm install
npm run build
sudo systemctl restart linea-worker
sudo systemctl status linea-worker --no-pager

# manual worker start

# stop systemd service first so two workers aren't running

sudo systemctl stop linea-worker
cd ~/Linea/worker
sudo -u linea-worker npm start
sudo systemctl start linea-worker

# firewall

sudo apt update
sudo apt install -y nftables

# check networking

ip route
ip -6 route
resolvectl status
ip neigh

# current aws networking

# worker private ip: 172.31.4.30

# vpc gateway: 172.31.0.1

# vpc dns: 172.31.0.2

# write nftables config

sudo tee /etc/nftables.conf > /dev/null <<'EOF'
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
chain input {
type filter hook input priority filter;
policy accept;
}

```
chain forward {
    type filter hook forward priority filter;
    policy accept;
}

chain output {
    type filter hook output priority filter;
    policy accept;

    # allow linea-worker to use aws vpc dns
    meta skuid 999 ip daddr 172.31.0.2 udp dport 53 accept
    meta skuid 999 ip daddr 172.31.0.2 tcp dport 53 accept

    # block ec2 metadata for linea-worker only
    meta skuid 999 ip daddr 169.254.169.254 reject

    # block private ipv4 for linea-worker only
    meta skuid 999 ip daddr 10.0.0.0/8 reject
    meta skuid 999 ip daddr 172.16.0.0/12 reject
    meta skuid 999 ip daddr 192.168.0.0/16 reject

    # block private/link-local ipv6 for linea-worker only
    meta skuid 999 ip6 daddr fc00::/7 reject
    meta skuid 999 ip6 daddr fe80::/10 reject
}
```

}
EOF

# IMPORTANT

# do not globally block 169.254.169.254

# aws cloud-init and ssm need ec2 metadata during boot

# metadata is blocked only for uid 999 / linea-worker

# validate firewall config

sudo nft -c -f /etc/nftables.conf

# load firewall

sudo nft -f /etc/nftables.conf

# check active rules

sudo nft list ruleset

# test public internet as ubuntu

curl -I --max-time 5 https://example.com

# test public internet as linea-worker

sudo -u linea-worker curl -I --max-time 5 https://example.com

# test metadata as ubuntu

curl -v --max-time 2 http://169.254.169.254/latest/meta-data/

# test metadata block as linea-worker

sudo -u linea-worker curl -v --max-time 2 http://169.254.169.254/latest/meta-data/

# test private network block as linea-worker

sudo -u linea-worker curl -v --max-time 2 http://172.31.0.1

# enable firewall at boot

sudo systemctl enable nftables
sudo systemctl restart nftables

# check firewall

sudo systemctl status nftables --no-pager
sudo nft list ruleset

# reboot test

sudo reboot

# after reconnecting

sudo nft list ruleset
sudo systemctl status linea-worker --no-pager
sudo -u linea-worker curl -I --max-time 5 https://example.com

# ssm recovery

# ec2 iam role needs:

AmazonSSMManagedInstanceCore

# check ssm agent

sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent.service --no-pager

# restart ssm agent

sudo systemctl restart snap.amazon-ssm-agent.amazon-ssm-agent.service

# serial console recovery

# set ubuntu password for serial console login

sudo passwd ubuntu

# ssh checks

systemctl status ssh.socket --no-pager
systemctl status ssh.service --no-pager
sudo ss -lntp | grep :22

# diagnostics

sudo journalctl -b -u linea-worker --no-pager
sudo journalctl -b -u ssh.socket -u ssh.service -u nftables.service --no-pager
sudo journalctl -b -1 --no-pager
sudo journalctl -b -1 -o short-monotonic --no-pager
systemd-analyze blame
systemd-analyze critical-chain

# local machine only

chmod 400 ~/.ssh/linea-worker-key.pem

# ssh

ssh -i ~/.ssh/linea-worker-key.pem ubuntu@WORKER_PUBLIC_HOST
