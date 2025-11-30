using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesAndSeedAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AvatarUrl", "CreatedAt", "Email", "PasswordHash", "Role", "UpdatedAt", "UserName" },
                values: new object[] { new Guid("11111111-1111-1111-1111-111111111111"), null, new DateTime(2025, 11, 26, 3, 22, 53, 697, DateTimeKind.Utc).AddTicks(8946), "admin@kita.com", "$2a$11$5glWJIvKFoXWFwYIKJVB5ONySehuC4cMyghaPfEdybGcBazIDZsmy", "Admin", new DateTime(2025, 11, 26, 3, 22, 53, 697, DateTimeKind.Utc).AddTicks(8947), "Admin" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
