using Microsoft.EntityFrameworkCore;
using StandManager.Entities;

namespace StandManager.Data;

public class StandManagerDbContext : DbContext
{
    public StandManagerDbContext(DbContextOptions<StandManagerDbContext> options) : base(options)
    {
    }

    public DbSet<PastelFlavor> PastelFlavors => Set<PastelFlavor>();
    public DbSet<CustomerSession> CustomerSessions => Set<CustomerSession>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemStatusHistory> OrderItemStatusHistories => Set<OrderItemStatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PastelFlavor>(entity =>
        {
            entity.Property(x => x.Name).IsRequired().HasMaxLength(80);
            entity.Property(x => x.Description).HasMaxLength(256);
            entity.Property(x => x.ImageUrl).HasMaxLength(256);
            entity.Property(x => x.Price).HasPrecision(10, 2).HasDefaultValue(0m);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<CustomerSession>(entity =>
        {
            entity.Property(x => x.DisplayName).IsRequired().HasMaxLength(120);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(x => x.CustomerNameSnapshot).IsRequired();
            entity.HasOne(o => o.CustomerSession)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(x => x.Quantity).HasDefaultValue(1);
            entity.Property(x => x.UnitPrice).HasPrecision(10, 2).HasDefaultValue(0m);
            entity.HasOne(i => i.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.PastelFlavor)
                .WithMany(f => f.OrderItems)
                .HasForeignKey(i => i.PastelFlavorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(o => o.StatusHistory)
                 .WithOne(h => h.OrderItem)
                 .HasForeignKey(h => h.OrderItemId)
                 .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(o => o.TotalAmount).HasPrecision(10, 2).HasDefaultValue(0m);
        });

        modelBuilder.Entity<OrderItemStatusHistory>(entity =>
        {
            entity.HasIndex(history => new { history.OrderItemId, history.ChangedAt });

            entity.HasOne(history => history.OrderItem)
                .WithMany(item => item.StatusHistory)
                .HasForeignKey(history => history.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasKey(h => h.Id);

            entity.Property(h => h.Status).IsRequired();

            entity.Property(h => h.ChangedAt).IsRequired();
        });
    }
}
