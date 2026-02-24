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
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ArtistFollowers') THEN
                        CREATE TABLE ""ArtistFollowers"" (
                            ""FollowedArtistsId"" uuid NOT NULL,
                            ""FollowedByUsersId"" uuid NOT NULL,
                            CONSTRAINT ""PK_ArtistFollowers"" PRIMARY KEY (""FollowedArtistsId"", ""FollowedByUsersId""),
                            CONSTRAINT ""FK_ArtistFollowers_Artists_FollowedArtistsId"" FOREIGN KEY (""FollowedArtistsId"") REFERENCES ""Artists"" (""Id"") ON DELETE CASCADE,
                            CONSTRAINT ""FK_ArtistFollowers_Users_FollowedByUsersId"" FOREIGN KEY (""FollowedByUsersId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE
                        );
                        CREATE INDEX ""IX_ArtistFollowers_FollowedByUsersId"" ON ""ArtistFollowers"" (""FollowedByUsersId"");
                    END IF;
                END
                $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArtistFollowers");
        }
    }
}
