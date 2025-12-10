using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearchVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "SearchVector",
                table: "Songs",
                type: "tsvector",
                nullable: true,
                computedColumnSql: "to_tsvector('english', coalesce(\"Title\", '') || ' ' || coalesce(\"Artist\", ''))",
                stored: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 10, 8, 47, 4, 372, DateTimeKind.Utc).AddTicks(2062), new DateTime(2025, 12, 10, 8, 47, 4, 372, DateTimeKind.Utc).AddTicks(2063) });

            migrationBuilder.CreateIndex(
                name: "IX_Songs_SearchVector",
                table: "Songs",
                column: "SearchVector")
                .Annotation("Npgsql:IndexMethod", "GIN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Songs_SearchVector",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                table: "Songs");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 10, 3, 6, 31, 459, DateTimeKind.Utc).AddTicks(8746), new DateTime(2025, 12, 10, 3, 6, 31, 459, DateTimeKind.Utc).AddTicks(8747) });
        }
    }
}
