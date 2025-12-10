using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeListenDateToYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ListenDate",
                table: "ListenWrappeds");

            migrationBuilder.AddColumn<List<Guid>>(
                name: "DislikedByUserIds",
                table: "SongStatics",
                type: "uuid[]",
                nullable: false);

            migrationBuilder.AddColumn<List<Guid>>(
                name: "FavoritedByUserIds",
                table: "SongStatics",
                type: "uuid[]",
                nullable: false);

            migrationBuilder.AddColumn<List<Guid>>(
                name: "LikedByUserIds",
                table: "SongStatics",
                type: "uuid[]",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "Year",
                table: "ListenWrappeds",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 10, 2, 22, 41, 418, DateTimeKind.Utc).AddTicks(7986), new DateTime(2025, 12, 10, 2, 22, 41, 418, DateTimeKind.Utc).AddTicks(7987) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DislikedByUserIds",
                table: "SongStatics");

            migrationBuilder.DropColumn(
                name: "FavoritedByUserIds",
                table: "SongStatics");

            migrationBuilder.DropColumn(
                name: "LikedByUserIds",
                table: "SongStatics");

            migrationBuilder.DropColumn(
                name: "Year",
                table: "ListenWrappeds");

            migrationBuilder.AddColumn<DateTime>(
                name: "ListenDate",
                table: "ListenWrappeds",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 5, 3, 37, 23, 958, DateTimeKind.Utc).AddTicks(5529), new DateTime(2025, 12, 5, 3, 37, 23, 958, DateTimeKind.Utc).AddTicks(5529) });
        }
    }
}
