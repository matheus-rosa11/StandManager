namespace StandManager.Application.Customers.Models;

public sealed record CustomerModel(int Id, string Name, bool IsVolunteer, DateTimeOffset CreatedAt);
