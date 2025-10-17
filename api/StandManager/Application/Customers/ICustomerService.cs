using System.Threading;
using System.Threading.Tasks;
using StandManager.Application.Common.Results;
using StandManager.Application.Customers.Models;

namespace StandManager.Application.Customers;

public interface ICustomerService
{
    Task<OperationResult<CustomerModel>> RegisterCustomerAsync(string name, CancellationToken cancellationToken);

    Task<CustomerModel?> GetCustomerAsync(int customerId, CancellationToken cancellationToken);

    Task<OperationResult<CustomerModel>> ConfirmCustomerAsync(int customerId, string providedName, CancellationToken cancellationToken);
}
