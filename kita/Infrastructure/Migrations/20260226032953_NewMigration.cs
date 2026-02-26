using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NewMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 3, 29, 53, 86, DateTimeKind.Utc).AddTicks(2102), new DateTime(2026, 2, 26, 3, 29, 53, 86, DateTimeKind.Utc).AddTicks(2102) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 1, 49, 52, 735, DateTimeKind.Utc).AddTicks(630), new DateTime(2026, 2, 26, 1, 49, 52, 735, DateTimeKind.Utc).AddTicks(631) });
        }
    }
}
