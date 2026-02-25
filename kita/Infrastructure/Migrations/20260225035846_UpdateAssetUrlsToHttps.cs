using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAssetUrlsToHttps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 25, 3, 58, 45, 992, DateTimeKind.Utc).AddTicks(2679), new DateTime(2026, 2, 25, 3, 58, 45, 992, DateTimeKind.Utc).AddTicks(2679) });

            migrationBuilder.Sql(@"
                UPDATE ""Users"" SET ""AvatarUrl"" = REPLACE(""AvatarUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""AvatarUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Songs"" SET ""StreamUrl"" = REPLACE(""StreamUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""StreamUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Songs"" SET ""CoverUrl"" = REPLACE(""CoverUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""CoverUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Playlists"" SET ""CoverUrl"" = REPLACE(""CoverUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""CoverUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Artists"" SET ""ImageUrl"" = REPLACE(""ImageUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""ImageUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Albums"" SET ""CoverUrl"" = REPLACE(""CoverUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""CoverUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Servers"" SET ""IconUrl"" = REPLACE(""IconUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""IconUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Messages"" SET ""ImageUrl"" = REPLACE(""ImageUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""ImageUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Messages"" SET ""VideoUrl"" = REPLACE(""VideoUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""VideoUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
                UPDATE ""Messages"" SET ""FileUrl"" = REPLACE(""FileUrl"", 'http://100.98.82.105:5064/Assets', 'https://api.kiseki.id.vn/Assets') WHERE ""FileUrl"" LIKE 'http://100.98.82.105:5064/Assets%';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 11, 1, 41, 35, 333, DateTimeKind.Utc).AddTicks(5823), new DateTime(2026, 2, 11, 1, 41, 35, 333, DateTimeKind.Utc).AddTicks(5824) });
        }
    }
}
