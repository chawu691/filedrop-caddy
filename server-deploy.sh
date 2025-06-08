#!/bin/bash

# Universal File Drop - 服务器一键部署脚本

set -e  # 遇到错误立即退出

echo "🚀 Universal File Drop 服务器部署脚本"
echo "====================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ 请不要使用root用户运行此脚本${NC}"
   echo "建议创建普通用户并添加到docker组"
   exit 1
fi

# 检查Docker是否安装
check_docker() {
    echo -e "${BLUE}🔍 检查Docker环境...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker未安装${NC}"
        echo "请先安装Docker："
        echo "curl -fsSL https://get.docker.com | sh"
        echo "sudo usermod -aG docker \$USER"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose未安装${NC}"
        echo "请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker服务未运行${NC}"
        echo "请启动Docker服务：sudo systemctl start docker"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker环境检查通过${NC}"
}

# 检查端口是否被占用
check_ports() {
    echo -e "${BLUE}🔍 检查端口占用...${NC}"
    
    if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        echo -e "${YELLOW}⚠️  端口80已被占用${NC}"
        echo "如果要使用Nginx反向代理，请先停止占用80端口的服务"
    fi
    
    if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
        echo -e "${YELLOW}⚠️  端口3001已被占用${NC}"
        echo "将尝试停止现有服务..."
        docker-compose down 2>/dev/null || true
    fi
}

# 创建必要的目录
create_directories() {
    echo -e "${BLUE}📁 创建数据目录...${NC}"
    
    mkdir -p data/uploads
    mkdir -p data/database
    mkdir -p ssl
    mkdir -p logs
    
    # 设置权限
    chmod 755 data
    chmod 755 data/uploads
    chmod 755 data/database
    
    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 配置环境变量
setup_environment() {
    echo -e "${BLUE}⚙️  配置环境变量...${NC}"
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ 已创建.env文件${NC}"
        else
            # 创建基本的.env文件
            cat > .env << EOF
NODE_ENV=production
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
SESSION_SECRET=$(openssl rand -hex 32)
EOF
            echo -e "${GREEN}✅ 已创建基本.env文件${NC}"
        fi
        
        echo -e "${YELLOW}⚠️  请编辑.env文件修改默认密码：${NC}"
        echo "nano .env"
    fi
}

# 部署应用
deploy_app() {
    echo -e "${BLUE}🚀 开始部署应用...${NC}"
    
    # 给脚本执行权限
    chmod +x deploy.sh 2>/dev/null || true
    
    # 选择部署模式
    echo "请选择部署模式："
    echo "1) 开发模式 (端口3001)"
    echo "2) 生产模式 (端口80，包含Nginx)"
    read -p "请输入选择 (1-2): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}🔧 启动开发模式...${NC}"
            docker-compose up -d --build
            echo -e "${GREEN}✅ 开发模式启动完成${NC}"
            echo -e "${GREEN}🌐 访问地址: http://$(hostname -I | awk '{print $1}'):3001${NC}"
            ;;
        2)
            echo -e "${BLUE}🏭 启动生产模式...${NC}"
            docker-compose -f docker-compose.prod.yml up -d --build
            echo -e "${GREEN}✅ 生产模式启动完成${NC}"
            echo -e "${GREEN}🌐 访问地址: http://$(hostname -I | awk '{print $1}')${NC}"
            ;;
        *)
            echo -e "${RED}❌ 无效选择${NC}"
            exit 1
            ;;
    esac
}

# 显示部署后信息
show_info() {
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "================================"
    echo -e "${BLUE}📊 服务状态:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}📝 有用的命令:${NC}"
    echo "  查看日志: docker-compose logs -f"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  查看状态: docker-compose ps"
    echo ""
    echo -e "${BLUE}🔧 管理后台:${NC}"
    echo "  地址: 主页面地址 + /#admin"
    echo "  用户名: admin"
    echo "  密码: password (请及时修改)"
    echo ""
    echo -e "${YELLOW}⚠️  安全提醒:${NC}"
    echo "  1. 修改默认管理员密码"
    echo "  2. 配置防火墙规则"
    echo "  3. 定期备份数据"
    echo "  4. 监控磁盘空间"
}

# 主函数
main() {
    echo -e "${BLUE}开始部署流程...${NC}"
    
    check_docker
    check_ports
    create_directories
    setup_environment
    deploy_app
    show_info
    
    echo ""
    echo -e "${GREEN}🚀 部署脚本执行完成！${NC}"
}

# 执行主函数
main "$@"
