using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserAndSongEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Subscription",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AudioQuality",
                table: "Songs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int[]>(
                name: "Genres",
                table: "Songs",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Songs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Songs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "Subscription", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 30, 4, 14, 55, 663, DateTimeKind.Utc).AddTicks(8778), 0, new DateTime(2025, 11, 30, 4, 14, 55, 663, DateTimeKind.Utc).AddTicks(8779) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Subscription",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AudioQuality",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Genres",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Songs");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 28, 13, 29, 47, 270, DateTimeKind.Utc).AddTicks(308), new DateTime(2025, 11, 28, 13, 29, 47, 270, DateTimeKind.Utc).AddTicks(308) });
        }
    }
}
