using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAlbumLikes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlbumLikes",
                columns: table => new
                {
                    LikedAlbumsId = table.Column<Guid>(type: "uuid", nullable: false),
                    LikedByUsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlbumLikes", x => new { x.LikedAlbumsId, x.LikedByUsersId });
                    table.ForeignKey(
                        name: "FK_AlbumLikes_Albums_LikedAlbumsId",
                        column: x => x.LikedAlbumsId,
                        principalTable: "Albums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AlbumLikes_Users_LikedByUsersId",
                        column: x => x.LikedByUsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 19, 8, 17, 13, 778, DateTimeKind.Utc).AddTicks(197), new DateTime(2025, 12, 19, 8, 17, 13, 778, DateTimeKind.Utc).AddTicks(198) });

            migrationBuilder.CreateIndex(
                name: "IX_AlbumLikes_LikedByUsersId",
                table: "AlbumLikes",
                column: "LikedByUsersId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlbumLikes");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 18, 13, 35, 10, 738, DateTimeKind.Utc).AddTicks(3769), new DateTime(2025, 12, 18, 13, 35, 10, 738, DateTimeKind.Utc).AddTicks(3770) });
        }
    }
}
