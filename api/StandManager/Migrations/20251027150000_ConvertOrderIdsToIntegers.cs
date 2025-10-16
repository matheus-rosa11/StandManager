using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace StandManager.Migrations
{
    /// <inheritdoc />
    public partial class ConvertOrderIdsToIntegers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems");

            migrationBuilder.CreateTable(
                name: "Orders_Temp",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerNameSnapshot = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0m),
                    LegacyId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders_Temp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Temp_CustomerSessions_CustomerSessionId",
                        column: x => x.CustomerSessionId,
                        principalTable: "CustomerSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Temp_CustomerSessionId",
                table: "Orders_Temp",
                column: "CustomerSessionId");

            migrationBuilder.Sql(@"INSERT INTO ""Orders_Temp"" (""CustomerSessionId"", ""CustomerNameSnapshot"", ""CreatedAt"", ""TotalAmount"", ""LegacyId"")
SELECT ""CustomerSessionId"", ""CustomerNameSnapshot"", ""CreatedAt"", ""TotalAmount"", ""Id""
FROM ""Orders""
ORDER BY ""CreatedAt"", ""Id"";");

            migrationBuilder.AddColumn<int>(
                name: "OrderIdInt",
                table: "OrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"UPDATE ""OrderItems"" AS oi
SET ""OrderIdInt"" = temp.""Id""
FROM ""Orders_Temp"" AS temp
WHERE oi.""OrderId"" = temp.""LegacyId"";");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "OrderItems");

            migrationBuilder.RenameColumn(
                name: "OrderIdInt",
                table: "OrderItems",
                newName: "OrderId");

            migrationBuilder.AlterColumn<int>(
                name: "OrderId",
                table: "OrderItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders_Temp",
                table: "Orders_Temp");

            migrationBuilder.RenameTable(
                name: "Orders_Temp",
                newName: "Orders");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_Temp_CustomerSessionId",
                table: "Orders",
                newName: "IX_Orders_CustomerSessionId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "Id");

            migrationBuilder.DropColumn(
                name: "LegacyId",
                table: "Orders");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems");

            migrationBuilder.CreateTable(
                name: "Orders_Legacy",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerSessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerNameSnapshot = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false, defaultValue: 0m),
                    NumericId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders_Legacy", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Legacy_CustomerSessions_CustomerSessionId",
                        column: x => x.CustomerSessionId,
                        principalTable: "CustomerSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Legacy_CustomerSessionId",
                table: "Orders_Legacy",
                column: "CustomerSessionId");

            migrationBuilder.Sql(@"INSERT INTO ""Orders_Legacy"" (""Id"", ""CustomerSessionId"", ""CustomerNameSnapshot"", ""CreatedAt"", ""TotalAmount"", ""NumericId"")
SELECT md5('order:' || ""Id""::text)::uuid, ""CustomerSessionId"", ""CustomerNameSnapshot"", ""CreatedAt"", ""TotalAmount"", ""Id""
FROM ""Orders""
ORDER BY ""CreatedAt"", ""Id"";");

            migrationBuilder.AddColumn<Guid>(
                name: "OrderIdGuid",
                table: "OrderItems",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);

            migrationBuilder.Sql(@"UPDATE ""OrderItems"" AS oi
SET ""OrderIdGuid"" = temp.""Id""
FROM ""Orders_Legacy"" AS temp
WHERE oi.""OrderId"" = temp.""NumericId"";");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "OrderItems");

            migrationBuilder.RenameColumn(
                name: "OrderIdGuid",
                table: "OrderItems",
                newName: "OrderId");

            migrationBuilder.AlterColumn<Guid>(
                name: "OrderId",
                table: "OrderItems",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldDefaultValue: Guid.Empty);

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Orders_Legacy",
                table: "Orders_Legacy");

            migrationBuilder.RenameTable(
                name: "Orders_Legacy",
                newName: "Orders");

            migrationBuilder.RenameIndex(
                name: "IX_Orders_Legacy_CustomerSessionId",
                table: "Orders",
                newName: "IX_Orders_CustomerSessionId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Orders",
                table: "Orders",
                column: "Id");

            migrationBuilder.DropColumn(
                name: "NumericId",
                table: "Orders");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Orders_OrderId",
                table: "OrderItems",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
