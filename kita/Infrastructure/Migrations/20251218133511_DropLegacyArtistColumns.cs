using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacyArtistColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop legacy columns that are no longer used
            migrationBuilder.Sql("ALTER TABLE \"Artists\" DROP COLUMN IF EXISTS \"ManagedBy\";");
            migrationBuilder.Sql("ALTER TABLE \"Artists\" DROP COLUMN IF EXISTS \"FollowedBy\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore the legacy columns
            migrationBuilder.AddColumn<List<Guid>>(
                name: "ManagedBy",
                table: "Artists",
                type: "uuid[]",
                nullable: false,
                defaultValue: new List<Guid>());

            migrationBuilder.AddColumn<List<Guid>>(
                name: "FollowedBy",
                table: "Artists",
                type: "uuid[]",
                nullable: false,
                defaultValue: new List<Guid>());
        }
    }
}
