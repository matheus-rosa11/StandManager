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
                new() { Name="Carne", Description="Carne moída temperada", ImageUrl="https://www.receitas-sem-fronteiras.com/media/pastel-maria_crop.jpg/rh/pastel-de-carne.jpg", Price=12.90m, AvailableQuantity=100 },
                new() { Name="Queijo", Description="Mussarela", ImageUrl="https://minhasreceitinhas.com.br/wp-content/uploads/2023/05/pastel-de-feira-de-queijo.jpg", Price=10.90m, AvailableQuantity=100 },
                new() { Name="Frango c/ Catupiry", ImageUrl="https://minhasreceitinhas.com.br/wp-content/uploads/2023/02/Pastel-de-frango-com-catupiry-1-1200x739.png", Price=11.90m, AvailableQuantity=100 },
                new() { Name="Chocolate", ImageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc2KhuhBW_6pDHkZRu5QRta0JgnPQxYa4QnA&s", Price=10.00m, AvailableQuantity=50 },
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
