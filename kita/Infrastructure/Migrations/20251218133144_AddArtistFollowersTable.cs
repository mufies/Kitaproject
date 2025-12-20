using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArtistFollowersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create ArtistFollowers join table
            migrationBuilder.CreateTable(
                name: "ArtistFollowers",
                columns: table => new
                {
                    FollowedArtistsId = table.Column<Guid>(type: "uuid", nullable: false),
                    FollowedByUsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtistFollowers", x => new { x.FollowedArtistsId, x.FollowedByUsersId });
                    table.ForeignKey(
                        name: "FK_ArtistFollowers_Artists_FollowedArtistsId",
                        column: x => x.FollowedArtistsId,
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

            migrationBuilder.CreateIndex(
                name: "IX_ArtistFollowers_FollowedByUsersId",
                table: "ArtistFollowers",
                column: "FollowedByUsersId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArtistFollowers");
        }
    }
}
