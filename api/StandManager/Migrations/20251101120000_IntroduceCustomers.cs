using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace StandManager.Migrations
{
    /// <inheritdoc />
    public partial class IntroduceCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_CustomerSessions_CustomerSessionId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CustomerSessionId",
                table: "Orders");

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "Orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsVolunteer = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LegacySessionId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_IsVolunteer_Name",
                table: "Customers",
                columns: new[] { "IsVolunteer", "Name" });

            migrationBuilder.Sql(@"
                INSERT INTO ""Customers"" (""Name"", ""CreatedAt"", ""IsVolunteer"", ""LegacySessionId"")
                SELECT ""DisplayName"", ""CreatedAt"", FALSE, ""Id""
                FROM ""CustomerSessions"";
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Orders"" o
                SET ""CustomerId"" = c.""Id""
                FROM ""Customers"" c
                WHERE c.""LegacySessionId"" = o.""CustomerSessionId"";
            ");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM ""Customers"") THEN
                        UPDATE ""Orders""
                        SET ""CustomerId"" = (
                            SELECT ""Id"" FROM ""Customers"" ORDER BY ""Id"" LIMIT 1)
                        WHERE ""CustomerId"" = 0;
                    END IF;
                END $$;
            ");

            migrationBuilder.DropColumn(
                name: "CustomerSessionId",
                table: "Orders");

            migrationBuilder.DropTable(
                name: "CustomerSessions");

            migrationBuilder.DropColumn(
                name: "LegacySessionId",
                table: "Customers");

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Orders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId",
                table: "Orders",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Customers_CustomerId",
                table: "Orders",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("The IntroduceCustomers migration cannot be reverted.");
        }
    }
}
