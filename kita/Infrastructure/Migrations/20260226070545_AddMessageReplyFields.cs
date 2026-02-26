using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageReplyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReplyToContent",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReplyToId",
                table: "Messages",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReplyToSenderName",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 7, 5, 45, 512, DateTimeKind.Utc).AddTicks(762), new DateTime(2026, 2, 26, 7, 5, 45, 512, DateTimeKind.Utc).AddTicks(764) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReplyToContent",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ReplyToId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ReplyToSenderName",
                table: "Messages");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 2, 26, 3, 29, 53, 86, DateTimeKind.Utc).AddTicks(2102), new DateTime(2026, 2, 26, 3, 29, 53, 86, DateTimeKind.Utc).AddTicks(2102) });
        }
    }
}
