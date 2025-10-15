using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using StandManager.Data;

#nullable disable

namespace StandManager.Migrations
{
    [DbContext(typeof(StandManagerDbContext))]
    partial class StandManagerDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.6")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            modelBuilder.Entity("StandManager.Entities.CustomerSession", b =>
            {
                b.Property<Guid>("Id")
                    .HasColumnType("TEXT");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("DisplayName")
                    .IsRequired()
                    .HasMaxLength(120)
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.ToTable("CustomerSessions");
            });

            modelBuilder.Entity("StandManager.Entities.Order", b =>
            {
                b.Property<Guid>("Id")
                    .HasColumnType("TEXT");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<Guid>("CustomerSessionId")
                    .HasColumnType("TEXT");

                b.Property<string>("CustomerNameSnapshot")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("CustomerSessionId");

                b.ToTable("Orders");
            });

            modelBuilder.Entity("StandManager.Entities.OrderItem", b =>
            {
                b.Property<Guid>("Id")
                    .HasColumnType("TEXT");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<DateTimeOffset?>("LastUpdatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("Notes")
                    .HasMaxLength(256)
                    .HasColumnType("TEXT");

                b.Property<Guid>("OrderId")
                    .HasColumnType("TEXT");

                b.Property<Guid>("PastelFlavorId")
                    .HasColumnType("TEXT");

                b.Property<int>("Quantity")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER")
                    .HasDefaultValue(1);

                b.Property<int>("Status")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.HasIndex("OrderId");

                b.HasIndex("PastelFlavorId");

                b.ToTable("OrderItems");
            });

            modelBuilder.Entity("StandManager.Entities.PastelFlavor", b =>
            {
                b.Property<Guid>("Id")
                    .HasColumnType("TEXT");

                b.Property<int>("AvailableQuantity")
                    .HasColumnType("INTEGER");

                b.Property<DateTimeOffset>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<string>("Description")
                    .HasMaxLength(256)
                    .HasColumnType("TEXT");

                b.Property<string>("ImageUrl")
                    .HasMaxLength(256)
                    .HasColumnType("TEXT");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasMaxLength(80)
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("Name")
                    .IsUnique();

                b.ToTable("PastelFlavors");
            });

            modelBuilder.Entity("StandManager.Entities.Order", b =>
            {
                b.HasOne("StandManager.Entities.CustomerSession", "CustomerSession")
                    .WithMany("Orders")
                    .HasForeignKey("CustomerSessionId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("CustomerSession");
            });

            modelBuilder.Entity("StandManager.Entities.OrderItem", b =>
            {
                b.HasOne("StandManager.Entities.Order", "Order")
                    .WithMany("Items")
                    .HasForeignKey("OrderId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.HasOne("StandManager.Entities.PastelFlavor", "PastelFlavor")
                    .WithMany("OrderItems")
                    .HasForeignKey("PastelFlavorId")
                    .OnDelete(DeleteBehavior.Restrict)
                    .IsRequired();

                b.Navigation("Order");

                b.Navigation("PastelFlavor");
            });

            modelBuilder.Entity("StandManager.Entities.CustomerSession", b =>
            {
                b.Navigation("Orders");
            });

            modelBuilder.Entity("StandManager.Entities.Order", b =>
            {
                b.Navigation("Items");
            });

            modelBuilder.Entity("StandManager.Entities.PastelFlavor", b =>
            {
                b.Navigation("OrderItems");
            });
#pragma warning restore 612, 618
        }
    }
}
