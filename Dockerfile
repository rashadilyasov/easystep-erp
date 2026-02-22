# Easy Step ERP API — repo root-dan build
# Root Directory boş olsa belə Railway bu Dockerfile ilə API-ni deploy edəcək.
# Root Directory = api olarsa, api/Dockerfile istifadə olunur.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY api/ .
RUN dotnet restore && dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
COPY api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/entrypoint.sh"]
