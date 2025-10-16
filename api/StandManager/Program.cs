using System.Globalization;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using StandManager.Application.Orders;
using StandManager.Application.Orders.Services;
using StandManager.Application.PastelFlavors;
using StandManager.Application.PastelFlavors.Services;
using StandManager.Data;
using System.Text.Json.Serialization;

namespace StandManager
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

            builder.Services
                .AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                })
                .AddDataAnnotationsLocalization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            builder.Services.AddDbContext<StandManagerDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddScoped<IPastelFlavorService, PastelFlavorService>();
            builder.Services.AddScoped<IOrderWorkflowService, OrderWorkflowService>();
            builder.Services.AddScoped<IOrderService, OrderService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Default", policy =>
                {
                    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                });
            });

            var supportedCultures = new[] { "en-US", "pt-BR" };
            builder.Services.Configure<RequestLocalizationOptions>(options =>
            {
                options.SetDefaultCulture(supportedCultures[0]);
                options.AddSupportedCultures(supportedCultures);
                options.AddSupportedUICultures(supportedCultures);
            });

#if !DEBUG
            var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";

                        if (!string.IsNullOrWhiteSpace(port))
                            builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
#endif
            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<StandManagerDbContext>();
                dbContext.Database.Migrate();
            }

            app.UseSwagger();
            app.UseSwaggerUI();

            app.UseRequestLocalization();
            app.UseHttpsRedirection();

            app.UseCors("Default");

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
