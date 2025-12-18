using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema_RemoveSearchVector_AddArtistManagers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ArtistFollowers",
                columns: table => new
                {
                    Artist1Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FollowedByUsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtistFollowers", x => new { x.Artist1Id, x.FollowedByUsersId });
                    table.ForeignKey(
                        name: "FK_ArtistFollowers_Artists_Artist1Id",
                        column: x => x.Artist1Id,
                        principalTable: "Artists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArtistFollowers_Users_FollowedByUsersId",
                        column: x => x.FollowedByUsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArtistManagers",
                columns: table => new
                {
                    ArtistId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManagedByUsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtistManagers", x => new { x.ArtistId, x.ManagedByUsersId });
                    table.ForeignKey(
                        name: "FK_ArtistManagers_Artists_ArtistId",
                        column: x => x.ArtistId,
                        principalTable: "Artists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArtistManagers_Users_ManagedByUsersId",
                        column: x => x.ManagedByUsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArtistFollowers_FollowedByUsersId",
                table: "ArtistFollowers",
                column: "FollowedByUsersId");

            migrationBuilder.CreateIndex(
                name: "IX_ArtistManagers_ManagedByUsersId",
                table: "ArtistManagers",
                column: "ManagedByUsersId");

            migrationBuilder.DropColumn(
                name: "SearchVector",
                table: "Songs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Albums_AlbumId",
                table: "Songs");

            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Artists_ArtistId",
                table: "Songs");

            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Users_UserId",
                table: "Songs");

            migrationBuilder.DropTable(
                name: "Albums");

            migrationBuilder.DropTable(
                name: "ArtistFollowers");

            migrationBuilder.DropTable(
                name: "ArtistManagers");

            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "ListenHistories");

            migrationBuilder.DropTable(
                name: "ListenWrappeds");

            migrationBuilder.DropTable(
                name: "Artists");

            migrationBuilder.DropTable(
                name: "SongStatics");

            migrationBuilder.DropIndex(
                name: "IX_Songs_AlbumId",
                table: "Songs");

            migrationBuilder.DropIndex(
                name: "IX_Songs_ArtistId",
                table: "Songs");

            migrationBuilder.DropIndex(
                name: "IX_Songs_UserId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "AlbumId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "ArtistId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Songs");

            migrationBuilder.AddColumn<string>(
                name: "Album",
                table: "Songs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Artist",
                table: "Songs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 11, 30, 8, 22, 29, 200, DateTimeKind.Utc).AddTicks(9940), new DateTime(2025, 11, 30, 8, 22, 29, 200, DateTimeKind.Utc).AddTicks(9941) });
        }
    }
}
