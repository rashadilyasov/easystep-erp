using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EasyStep.Erp.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailOtpAndTwoFactorViaEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "TwoFactorViaEmail",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "EmailOtpCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CodeHash = table.Column<string>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailOtpCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailOtpCodes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailOtpCodes_ExpiresAt",
                table: "EmailOtpCodes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_EmailOtpCodes_UserId",
                table: "EmailOtpCodes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailOtpCodes");

            migrationBuilder.DropColumn(
                name: "TwoFactorViaEmail",
                table: "Users");
        }
    }
}
