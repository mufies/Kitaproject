using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearchVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Enable pg_trgm extension for fuzzy matching
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            // Add SearchVector computed column
            migrationBuilder.Sql(@"
                ALTER TABLE ""Songs"" 
                ADD COLUMN ""SearchVector"" tsvector 
                GENERATED ALWAYS AS (
                    to_tsvector('english', coalesce(""Title"", '') || ' ' || coalesce(""Artist"", ''))
                ) STORED;
            ");

            // Add GIN index for full-text search
            migrationBuilder.Sql(@"
                CREATE INDEX ""IX_Songs_SearchVector"" 
                ON ""Songs"" 
                USING GIN (""SearchVector"");
            ");

            // Add trigram indexes for fuzzy fallback search
            migrationBuilder.Sql(@"
                CREATE INDEX ""IX_Songs_Title_Trgm"" 
                ON ""Songs"" 
                USING GIN (""Title"" gin_trgm_ops);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX ""IX_Songs_Artist_Trgm"" 
                ON ""Songs"" 
                USING GIN (""Artist"" gin_trgm_ops);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Songs_Artist_Trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Songs_Title_Trgm"";");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Songs_SearchVector"";");

            // Drop column
            migrationBuilder.Sql(@"ALTER TABLE ""Songs"" DROP COLUMN IF EXISTS ""SearchVector"";");
            
            // Note: We don't drop the pg_trgm extension as other parts of the system might use it
        }
    }
}
