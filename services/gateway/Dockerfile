# 使用Golang 1.21的Alpine镜像作为构建环境
FROM golang:1.21-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN go build -o /out/gateway .

# 运行时环境
FROM alpine:3.19
WORKDIR /app
COPY --from=build /out/gateway /app/gateway
ENV PY_SERVICE_URL=http://pyllm:8000
EXPOSE 8080
CMD ["/app/gateway"]

