using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MakeUserIdNullableInSongAndSongStatics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SongStatics_Users_UserId",
                table: "SongStatics");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "SongStatics",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Songs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 10, 3, 6, 31, 459, DateTimeKind.Utc).AddTicks(8746), new DateTime(2025, 12, 10, 3, 6, 31, 459, DateTimeKind.Utc).AddTicks(8747) });

            migrationBuilder.AddForeignKey(
                name: "FK_SongStatics_Users_UserId",
                table: "SongStatics",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SongStatics_Users_UserId",
                table: "SongStatics");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "SongStatics",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Songs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2025, 12, 10, 2, 22, 41, 418, DateTimeKind.Utc).AddTicks(7986), new DateTime(2025, 12, 10, 2, 22, 41, 418, DateTimeKind.Utc).AddTicks(7987) });

            migrationBuilder.AddForeignKey(
                name: "FK_SongStatics_Users_UserId",
                table: "SongStatics",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
