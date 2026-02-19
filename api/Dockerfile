FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
# Railway PORT runtime-da inject edir - shell ilə expand et
ENTRYPOINT ["/bin/sh", "-c", "exec dotnet EasyStep.Erp.Api.dll --urls \"http://0.0.0.0:${PORT:-8080}\""]
