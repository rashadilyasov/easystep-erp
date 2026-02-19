# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore && dotnet publish -c Release -o /app/publish

# Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

# Entrypoint with PORT from Railway
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
