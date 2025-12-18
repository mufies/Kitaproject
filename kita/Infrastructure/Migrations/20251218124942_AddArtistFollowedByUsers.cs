using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArtistFollowedByUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 18, 12, 49, 42, 289, DateTimeKind.Utc).AddTicks(6148), new DateTime(2025, 12, 18, 12, 49, 42, 289, DateTimeKind.Utc).AddTicks(6150) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 18, 12, 41, 0, 528, DateTimeKind.Utc).AddTicks(823), new DateTime(2025, 12, 18, 12, 41, 0, 528, DateTimeKind.Utc).AddTicks(824) });
        }
    }
}
