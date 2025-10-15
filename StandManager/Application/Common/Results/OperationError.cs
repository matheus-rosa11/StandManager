namespace StandManager.Application.Common.Results;

public sealed record OperationError(string Code, string? PropertyName = null, params object?[] Parameters);
