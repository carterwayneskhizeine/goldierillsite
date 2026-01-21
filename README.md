#### 构建并启动容器
docker-compose up -d

#### 查看日志
docker-compose logs -f

#### 停止容器
docker-compose down

#### 重新构建镜像
docker-compose up -d --build


docker-compose down & docker-compose up -d

启动后访问 http://localhost:5933 即可看到你的项目。代码修改会自动热重载（通过 volumes 挂载）。