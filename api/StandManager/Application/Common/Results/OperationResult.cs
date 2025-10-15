using System;
using System.Collections.Generic;
using System.Linq;

namespace StandManager.Application.Common.Results;

public class OperationResult
{
    protected OperationResult(bool succeeded, IReadOnlyCollection<OperationError> errors)
    {
        Succeeded = succeeded;
        Errors = errors;
    }

    public bool Succeeded { get; }

    public IReadOnlyCollection<OperationError> Errors { get; }

    public static OperationResult Success() => new(true, Array.Empty<OperationError>());

    public static OperationResult Failure(params OperationError[] errors)
        => new(false, errors);

    public static OperationResult Failure(IEnumerable<OperationError> errors)
        => new(false, errors.ToArray());
}

public sealed class OperationResult<T> : OperationResult
{
    private OperationResult(bool succeeded, T? value, IReadOnlyCollection<OperationError> errors)
        : base(succeeded, errors)
    {
        Value = value;
    }

    public T? Value { get; }

    public static OperationResult<T> Success(T value)
        => new(true, value, Array.Empty<OperationError>());

    public static OperationResult<T> Failure(params OperationError[] errors)
        => new(false, default, errors);

    public static OperationResult<T> Failure(IEnumerable<OperationError> errors)
        => new(false, default, errors.ToArray());
}
