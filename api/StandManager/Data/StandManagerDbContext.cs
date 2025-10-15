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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PastelFlavor>(entity =>
        {
            entity.Property(x => x.Name).IsRequired().HasMaxLength(80);
            entity.Property(x => x.Description).HasMaxLength(256);
            entity.Property(x => x.ImageUrl).HasMaxLength(256);
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
            entity.HasOne(i => i.Order)
                .WithMany(o => o.Items)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.PastelFlavor)
                .WithMany(f => f.OrderItems)
                .HasForeignKey(i => i.PastelFlavorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
