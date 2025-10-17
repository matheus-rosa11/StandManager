using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StandManager.Application.Common.Errors;
using StandManager.Application.Common.Results;
using StandManager.Application.Customers.Models;
using StandManager.Data;
using StandManager.Entities;

namespace StandManager.Application.Customers.Services;

public sealed class CustomerService : ICustomerService
{
    private readonly StandManagerDbContext _dbContext;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(StandManagerDbContext dbContext, ILogger<CustomerService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<OperationResult<CustomerModel>> RegisterCustomerAsync(string name, CancellationToken cancellationToken)
    {
        var normalizedName = (name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            return OperationResult<CustomerModel>.Failure(new OperationError(ErrorCodes.CustomerNameRequired, nameof(name)));
        }

        var customer = new Customer
        {
            Name = normalizedName,
            IsVolunteer = false
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Customer {CustomerId} registered with name {CustomerName}", customer.Id, customer.Name);

        return OperationResult<CustomerModel>.Success(Map(customer));
    }

    public async Task<CustomerModel?> GetCustomerAsync(int customerId, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId && !c.IsVolunteer, cancellationToken);

        return customer is null ? null : Map(customer);
    }

    public async Task<OperationResult<CustomerModel>> ConfirmCustomerAsync(int customerId, string providedName, CancellationToken cancellationToken)
    {
        var normalizedName = (providedName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            return OperationResult<CustomerModel>.Failure(new OperationError(ErrorCodes.CustomerNameRequired, nameof(providedName)));
        }

        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && !c.IsVolunteer, cancellationToken);

        if (customer is null)
        {
            return OperationResult<CustomerModel>.Failure(new OperationError(ErrorCodes.CustomerNotFound, nameof(customerId)));
        }

        if (!string.Equals(customer.Name, normalizedName, StringComparison.OrdinalIgnoreCase))
        {
            return OperationResult<CustomerModel>.Failure(new OperationError(ErrorCodes.CustomerNameMismatch, nameof(providedName)));
        }

        if (!string.Equals(customer.Name, normalizedName, StringComparison.Ordinal))
        {
            customer.Name = normalizedName;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return OperationResult<CustomerModel>.Success(Map(customer));
    }

    private static CustomerModel Map(Customer customer)
        => new(customer.Id, customer.Name, customer.IsVolunteer, customer.CreatedAt);
}
