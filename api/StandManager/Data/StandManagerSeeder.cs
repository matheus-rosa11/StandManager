using Microsoft.EntityFrameworkCore;
using StandManager.Entities;

namespace StandManager.Data
{
    public class StandManagerSeeder
    {
        public static async Task SeedAsync(StandManagerDbContext db)
        {
            await SeedPastelFlavorsAsync(db);
            // Pode chamar outros seeds (ex.: preços promocionais, status, etc.)
        }

        private static async Task SeedPastelFlavorsAsync(StandManagerDbContext db)
        {
            var defaults = new List<PastelFlavor>
            {
                new() { Name="Carne", Description="Carne moída temperada", Price=12.90m, AvailableQuantity=100 },
                new() { Name="Queijo", Description="Mussarela", Price=10.90m, AvailableQuantity=100 },
                new() { Name="Frango c/ Catupiry", Price=11.90m, AvailableQuantity=100 },
                new() { Name="Chocolate", Price=10.00m, AvailableQuantity=50 },
            };

            foreach (var item in defaults)
            {
                // critério de unicidade: Name
                var existing = await db.PastelFlavors
                    .FirstOrDefaultAsync(x => x.Name == item.Name);

                if (existing is null)
                {
                    await db.PastelFlavors.AddAsync(item);
                }
                else
                {
                    // Upsert: atualiza campos que podem mudar no tempo
                    existing.Description = item.Description;
                    existing.Price = item.Price;
                    existing.AvailableQuantity = item.AvailableQuantity;
                }
            }

            await db.SaveChangesAsync();
        }
    }
}
