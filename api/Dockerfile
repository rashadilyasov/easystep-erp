FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
# Railway PORT runtime-da inject edir - Program.cs istifadə edir
ENTRYPOINT ["dotnet", "EasyStep.Erp.Api.dll"]
